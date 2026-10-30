#!/usr/bin/env python3
"""
Universal Multi-Platform Watermark-Free Video Parser & Downloader
Supports:
  1. Douyin (抖音) - Native ABogus + x-secsdk-web-signature (websign) + UIFID_TEMP
  2. Bilibili (哔哩哔哩) - Native buvid3 + WBI signature
  3. TikTok - tikwm HD API + yt-dlp fallback
  4. Xiaohongshu (小红书) - __INITIAL_STATE__ masterUrl + og:video extractor
  5. Kuaishou (快手) - INIT_STATE / photoUrl extractor + yt-dlp fallback
  6. YouTube / Twitter(X) / Weibo / Instagram / Direct MP4 - yt-dlp + HTTP stream
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import string
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

# Ensure backend directory is in sys.path so dtk.signing.native imports cleanly
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dtk.signing.native.abogus import ABogus, DEFAULT_BROWSER_INFO
from dtk.signing.native import websign
from dtk.signing.native import wbi

DESKTOP_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
)

SESSION_CACHE_FILE = BACKEND_DIR / "douyin_guest_session.json"

# Pre-minted Douyin guest identity (auto-refreshed if expired)
DEFAULT_DOUYIN_COOKIES = {
    "ttwid": "1%7CjfoTNTHVBzuyHq8TNHnQOa5PYfNO8rUGoDGr3OSiw0M%7C1793276981%7C849d081addf1dde65f0e4388400054da035e26680169c74ef65e6dd65223b4a7",
    "UIFID_TEMP": "c4a29131752d59acb78af076c3dbdd52744118e38e80b4b96439ef1e20799db01c7fc87034aade3b66fb150b4a8d9f593ab2203bfd3458b369c5e70c61401f59d6feb5a27bbe4643521222fb2b545b73",
    "x-web-secsdk-uid": "c3a0b42a-a552-46d5-850f-1e0e75789689",
}

# Robust URL extraction regex from Evil0ctal/Douyin_TikTok_Download_API
_URL_BODY = (
    r"[^\s<>\"'`\\"
    r"\u2018\u2019\u201c\u201d"
    r"\u3000-\u303f"
    r"\u3400-\u4dbf"
    r"\u4e00-\u9fff"
    r"\uff00-\uffef"
    r"\U0001f000-\U0001faff"
    r"]"
)
URL_IN_TEXT_RE = re.compile(rf"https?://{_URL_BODY}+", re.IGNORECASE)
TRAILING_JUNK = ".,;:!?)]}>'\"\u3001\u3002\uff0c\uff01\uff1f\uff09\u3011\u300b\u201d\u2019"


def extract_clean_url(text: str) -> str | None:
    """Extract the first valid HTTP/HTTPS URL from messy share text."""
    text = text.strip()
    match = URL_IN_TEXT_RE.search(text)
    if match:
        return match.group(0).rstrip(TRAILING_JUNK)

    # Check if user pasted a bare 19-digit Douyin video ID
    bare_dy = re.search(r"\b(\d{18,20})\b", text)
    if bare_dy:
        return f"https://www.douyin.com/video/{bare_dy.group(1)}"

    # Check if user pasted a bare Bilibili BV ID
    bare_bv = re.search(r"\b(BV1[1-9A-HJ-NP-Za-km-z]{9})\b", text)
    if bare_bv:
        return f"https://www.bilibili.com/video/{bare_bv.group(1)}"

    # Check scheme-less v.douyin.com/xxx or b23.tv/xxx
    bare_domain = re.search(
        rf"((?:v\.douyin\.com|www\.douyin\.com|b23\.tv|www\.bilibili\.com|v\.kuaishou\.com|xhslink\.com|vm\.tiktok\.com)/{_URL_BODY}+)",
        text,
        re.IGNORECASE,
    )
    if bare_domain:
        return "https://" + bare_domain.group(1).rstrip(TRAILING_JUNK)

    return None


def detect_platform(url: str) -> str:
    host = urllib.parse.urlsplit(url).netloc.lower()
    if any(d in host for d in ("douyin.com", "iesdouyin.com", "amemv.com")):
        return "douyin"
    if "tiktok.com" in host:
        return "tiktok"
    if any(d in host for d in ("bilibili.com", "b23.tv", "bili2233.cn")):
        return "bilibili"
    if any(d in host for d in ("xiaohongshu.com", "xhslink.com")):
        return "xiaohongshu"
    if any(d in host for d in ("kuaishou.com", "chenzhongtech.com")):
        return "kuaishou"
    if any(d in host for d in ("weibo.com", "weibo.cn")):
        return "weibo"
    if any(d in host for d in ("youtube.com", "youtu.be")):
        return "youtube"
    if any(d in host for d in ("twitter.com", "x.com")):
        return "twitter"
    if "instagram.com" in host:
        return "instagram"
    if re.search(r"\.(mp4|mov|webm|m4v)(\?|$)", url, re.IGNORECASE):
        return "direct"
    return "generic"


def expand_short_url(url: str, ua: str = MOBILE_UA) -> str:
    """Follow 301/302 redirects to find the canonical URL."""
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            return None

    opener = urllib.request.build_opener(NoRedirect)
    current = url
    for _ in range(5):
        req = urllib.request.Request(current, headers={"User-Agent": ua})
        try:
            with opener.open(req, timeout=10) as resp:
                return resp.geturl() or current
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                loc = e.headers.get("Location")
                if not loc:
                    break
                current = urllib.parse.urljoin(current, loc)
                # Stop early if we already see the video ID in the redirect URL
                if re.search(r"(?:video/|note/|modal_id=|vid=|BV1)", current):
                    return current
            else:
                break
        except Exception:
            break
    return current


def load_douyin_cookies() -> dict[str, str]:
    if SESSION_CACHE_FILE.is_file():
        try:
            data = json.loads(SESSION_CACHE_FILE.read_text("utf-8"))
            if data.get("UIFID_TEMP") and data.get("ttwid"):
                return data
        except Exception:
            pass
    return dict(DEFAULT_DOUYIN_COOKIES)


def mint_douyin_cookies_via_playwright() -> dict[str, str] | None:
    """Refresh Douyin guest cookies (UIFID_TEMP & ttwid) using headless Chromium if needed."""
    node_script = """
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  await page.goto('https://www.douyin.com/', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(3500);
  const cookies = await context.cookies();
  const map = {};
  for (const c of cookies) map[c.name] = c.value;
  console.log('JSON_COOKIES:' + JSON.stringify(map));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
"""
    env = dict(os.environ)
    global_nm = "/root/.bun/install/global/node_modules"
    if os.path.isdir(global_nm):
        env["NODE_PATH"] = global_nm

    try:
        proc = subprocess.run(
            ["node", "-e", node_script],
            env=env,
            capture_output=True,
            text=True,
            timeout=35,
        )
        for line in proc.stdout.splitlines():
            if line.startswith("JSON_COOKIES:"):
                cookies = json.loads(line[len("JSON_COOKIES:") :])
                if cookies.get("UIFID_TEMP") and cookies.get("ttwid"):
                    SESSION_CACHE_FILE.write_text(json.dumps(cookies, indent=2), "utf-8")
                    return cookies
    except Exception:
        pass
    return None


def extract_douyin_aweme_id(url: str) -> str | None:
    """Extract numeric aweme_id from any Douyin URL shape."""
    patterns = [
        r"[?&]modal_id=(\d{15,22})",
        r"[?&]vid=(\d{15,22})",
        r"[?&]item_ids=(\d{15,22})",
        r"/(?:share/)?(?:video|note|slides)/(\d{15,22})",
        r"\b(\d{18,20})\b",
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None


def douyin_signed_get(endpoint_url: str, extra_params: list[tuple[str, str]], cookies: dict[str, str]) -> dict[str, Any]:
    ms_token = "".join(random.choices(string.ascii_letters + string.digits + "_-", k=126)) + "=="
    base_params: list[tuple[str, str]] = [
        ("device_platform", "webapp"),
        ("aid", "6383"),
        ("channel", "channel_pc_web"),
        *extra_params,
        ("pc_client_type", "1"),
        ("version_code", "290100"),
        ("version_name", "29.1.0"),
        ("cookie_enabled", "true"),
        ("screen_width", "1920"),
        ("screen_height", "1080"),
        ("browser_language", "zh-CN"),
        ("browser_platform", "Win32"),
        ("browser_name", "Chrome"),
        ("browser_version", "131.0.0.0"),
        ("browser_online", "true"),
        ("engine_name", "Blink"),
        ("engine_version", "131.0.0.0"),
        ("os_name", "Windows"),
        ("os_version", "10"),
        ("cpu_core_num", "8"),
        ("device_memory", "8"),
        ("platform", "PC"),
        ("downlink", "10"),
        ("effective_type", "4g"),
        ("round_trip_time", "50"),
        ("msToken", ms_token),
    ]
    query = "&".join(
        f"{urllib.parse.quote(k, safe='-._~')}={urllib.parse.quote(str(v), safe='-._~')}"
        for k, v in base_params
    )
    bogus = ABogus(DESKTOP_UA, browser_info=DEFAULT_BROWSER_INFO).get_value(query)
    pairs = [(k, str(v)) for k, v in base_params] + [("a_bogus", bogus)]
    uifid = websign.pick_uifid(cookies) or DEFAULT_DOUYIN_COOKIES["UIFID_TEMP"]
    signed_query, _, sig_headers = websign.sign(pairs, uifid)
    full_url = f"{endpoint_url}?{signed_query}"

    cookie_header = "; ".join(
        f"{k}={v}"
        for k, v in cookies.items()
        if k in ("ttwid", "UIFID_TEMP", "UIFID", "uifid", "s_v_web_id", "odin_tt", "sessionid", "x-web-secsdk-uid", "web_sign_token")
    )
    headers = {
        "User-Agent": DESKTOP_UA,
        "Referer": "https://www.douyin.com/",
        "Origin": "https://www.douyin.com",
        "Accept": "application/json, text/plain, */*",
        "Cookie": cookie_header,
        **sig_headers,
    }
    req = urllib.request.Request(full_url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read().decode("utf-8", "replace")
        if not raw:
            raise RuntimeError("Empty response from Douyin API")
        return json.loads(raw)


def parse_douyin_item(item: dict[str, Any], aweme_id: str) -> dict[str, Any]:
    desc = item.get("desc") or f"抖音视频_{aweme_id}"
    author = (item.get("author") or {}).get("nickname") or "抖音创作者"
    video_info = item.get("video") or {}
    duration_ms = video_info.get("duration") or 0
    duration = round(duration_ms / 1000.0, 2) if duration_ms > 100 else float(duration_ms)
    width = video_info.get("width") or 1080
    height = video_info.get("height") or 1920

    cover_urls = (video_info.get("cover") or {}).get("url_list") or (video_info.get("origin_cover") or {}).get("url_list") or []
    cover = cover_urls[0] if cover_urls else ""

    # Select highest quality H.264 MP4 stream from bit_rate or play_addr
    candidates: list[str] = []
    bit_rates = video_info.get("bit_rate") or []
    # Prefer H.264 (is_h265 == 0) for universal browser & FFmpeg compatibility
    h264_rates = [b for b in bit_rates if not b.get("is_h265") and not b.get("is_bytevc1")]
    sorted_rates = sorted(h264_rates or bit_rates, key=lambda x: x.get("bit_rate", 0), reverse=True)
    for br in sorted_rates:
        urls = (br.get("play_addr") or {}).get("url_list") or []
        for u in urls:
            if u and u not in candidates:
                candidates.append(u.replace("playwm", "play"))

    play_urls = (video_info.get("play_addr") or {}).get("url_list") or []
    for u in play_urls:
        clean_u = u.replace("playwm", "play")
        if clean_u and clean_u not in candidates and ".mp3" not in clean_u.lower():
            candidates.append(clean_u)

    # Also check if it's a Douyin Live Photo / Note with embedded video clips
    images_list = item.get("images") or []
    image_urls: list[str] = []
    for img in images_list:
        if isinstance(img, dict):
            u_list = img.get("url_list") or []
            if u_list:
                image_urls.append(u_list[0])
            clip_video = img.get("video") or {}
            clip_urls = (clip_video.get("play_addr") or {}).get("url_list") or []
            for cu in clip_urls:
                if cu and cu not in candidates:
                    candidates.append(cu.replace("playwm", "play"))

    if not candidates:
        raise RuntimeError("该抖音作品未包含可下载的视频流（可能是纯静态图文作品或已被删除）")

    return {
        "platform": "douyin",
        "platformName": "抖音 (Douyin)",
        "engine": "Evil0ctal/Douyin_TikTok_Download_API (ABogus + Websign)",
        "videoId": aweme_id,
        "title": desc,
        "author": author,
        "cover": cover or (image_urls[0] if image_urls else ""),
        "duration": duration,
        "width": width,
        "height": height,
        "videoUrl": candidates[0],
        "backupUrls": candidates[1:5],
        "images": image_urls[:9],
        "headers": {
            "User-Agent": DESKTOP_UA,
            "Referer": "https://www.douyin.com/",
        },
    }


def fetch_douyin_detail_via_playwright(aweme_id: str) -> dict[str, Any] | None:
    """Fallback: open the Douyin video page in headless Chromium and capture aweme_detail + fresh cookies."""
    node_script = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch({{ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] }});
  const context = await browser.newContext({{
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  }});
  const page = await context.newPage();
  await page.addInitScript(() => {{
    Object.defineProperty(navigator, 'webdriver', {{ get: () => undefined }});
  }});
  let detailJson = null;
  page.on('response', async (res) => {{
    if (res.url().includes('/aweme/v1/web/aweme/detail/')) {{
      try {{
        const d = await res.json();
        if (d && d.aweme_detail) detailJson = d.aweme_detail;
      }} catch {{}}
    }}
  }});
  await page.goto('https://www.douyin.com/video/{aweme_id}', {{ waitUntil: 'domcontentloaded', timeout: 25000 }});
  for (let i = 0; i < 12; i++) {{
    if (detailJson) break;
    await page.waitForTimeout(500);
  }}
  const cookies = await context.cookies();
  const map = {{}};
  for (const c of cookies) map[c.name] = c.value;
  console.log('PW_RESULT:' + JSON.stringify({{ cookies: map, detail: detailJson }}));
  await browser.close();
}})().catch(e => {{ console.error(e); process.exit(1); }});
"""
    env = dict(os.environ)
    global_nm = "/root/.bun/install/global/node_modules"
    if os.path.isdir(global_nm):
        env["NODE_PATH"] = global_nm

    try:
        proc = subprocess.run(
            ["node", "-e", node_script],
            env=env,
            capture_output=True,
            text=True,
            timeout=35,
        )
        for line in proc.stdout.splitlines():
            if line.startswith("PW_RESULT:"):
                payload = json.loads(line[len("PW_RESULT:") :])
                cookies = payload.get("cookies") or {}
                if cookies.get("UIFID_TEMP") and cookies.get("ttwid"):
                    SESSION_CACHE_FILE.write_text(json.dumps(cookies, indent=2), "utf-8")
                if payload.get("detail"):
                    return payload["detail"]
    except Exception:
        pass
    return None


def parse_douyin(url: str) -> dict[str, Any]:
    aweme_id = extract_douyin_aweme_id(url)
    expanded = url
    if not aweme_id:
        expanded = expand_short_url(url)
        aweme_id = extract_douyin_aweme_id(expanded)
    if not aweme_id:
        raise RuntimeError(f"未能从链接中提取到抖音视频 ID (解析后地址: {expanded})")

    cookies = load_douyin_cookies()
    last_err = None

    # Attempt 1: Fast native ABogus + websign call
    try:
        data = douyin_signed_get(
            "https://www.douyin.com/aweme/v1/web/aweme/detail/",
            [("aweme_id", aweme_id)],
            cookies,
        )
        detail = data.get("aweme_detail")
        if detail:
            return parse_douyin_item(detail, aweme_id)
        filter_info = (data.get("filter_detail") or {}).get("notice") or data.get("status_msg")
        last_err = f"抖音返回提示: {filter_info}" if filter_info else f"aweme_detail 为空"
    except Exception as e:
        last_err = str(e)

    # Attempt 2: Headless Chromium network interception + cookie refresh
    pw_detail = fetch_douyin_detail_via_playwright(aweme_id)
    if pw_detail:
        return parse_douyin_item(pw_detail, aweme_id)

    # Attempt 3: Retry native signed call with freshly minted cookies
    cookies = load_douyin_cookies()
    try:
        data = douyin_signed_get(
            "https://www.douyin.com/aweme/v1/web/aweme/detail/",
            [("aweme_id", aweme_id)],
            cookies,
        )
        detail = data.get("aweme_detail")
        if detail:
            return parse_douyin_item(detail, aweme_id)
    except Exception as e:
        last_err = str(e)

    raise RuntimeError(f"抖音视频解析失败 ({last_err})。请确认该链接为公开可访问的抖音视频。")


def fetch_douyin_trending_videos(count: int = 6) -> list[dict[str, Any]]:
    """Fetch real live videos from Douyin so users can test with 1 click."""
    cookies = load_douyin_cookies()
    seed_ids = ["7684905495467991014", "7372484719365098803"]
    results: list[dict[str, Any]] = []

    for seed in seed_ids:
        try:
            data = douyin_signed_get(
                "https://www.douyin.com/aweme/v1/web/aweme/related/",
                [("aweme_id", seed), ("count", str(count + 4)), ("filterGids", "")],
                cookies,
            )
            for item in data.get("aweme_list") or []:
                aid = item.get("aweme_id")
                if not aid:
                    continue
                try:
                    parsed = parse_douyin_item(item, str(aid))
                    parsed["shareUrl"] = f"https://www.douyin.com/video/{aid}"
                    results.append(parsed)
                    if len(results) >= count:
                        return results
                except Exception:
                    continue
        except Exception:
            continue
    return results


def parse_bilibili(url: str) -> dict[str, Any]:
    bvid_match = re.search(r"(BV1[1-9A-HJ-NP-Za-km-z]{9})", url)
    if not bvid_match:
        expanded = expand_short_url(url, ua=DESKTOP_UA)
        bvid_match = re.search(r"(BV1[1-9A-HJ-NP-Za-km-z]{9})", expanded)
    if not bvid_match:
        raise RuntimeError("未能从链接中提取到哔哩哔哩 BV 视频号")
    bvid = bvid_match.group(1)

    def get_json(api_url: str, cookies: dict[str, str] | None = None) -> dict[str, Any]:
        headers = {"User-Agent": DESKTOP_UA, "Referer": "https://www.bilibili.com/"}
        if cookies:
            headers["Cookie"] = "; ".join(f"{k}={v}" for k, v in cookies.items())
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8", "replace"))

    spi = get_json("https://api.bilibili.com/x/frontend/finger/spi")
    cookies = {
        "buvid3": spi["data"]["b_3"],
        "buvid4": spi["data"].get("b_4", ""),
        "b_nut": str(int(time.time())),
    }
    nav = get_json("https://api.bilibili.com/x/web-interface/nav", cookies)
    keys = wbi.keys_from_nav(nav)

    view_q, _ = wbi.sign({"bvid": bvid}, keys, wts=int(time.time()))
    view_res = get_json(f"https://api.bilibili.com/x/web-interface/wbi/view?{view_q}", cookies)
    if view_res.get("code") != 0 or not view_res.get("data"):
        raise RuntimeError(f"B站视频信息获取失败: {view_res.get('message', '未知错误')}")

    vdata = view_res["data"]
    cid = vdata["cid"]
    title = vdata.get("title") or f"Bilibili_{bvid}"
    author = (vdata.get("owner") or {}).get("name") or "UP主"
    cover = vdata.get("pic") or ""
    duration = float(vdata.get("duration") or 0)
    dim = vdata.get("dimension") or {}
    width = dim.get("width") or 1920
    height = dim.get("height") or 1080

    play_q, _ = wbi.sign(
        {
            "bvid": bvid,
            "cid": str(cid),
            "qn": "80",
            "fnval": "1",
            "platform": "html5",
            "high_quality": "1",
        },
        keys,
        wts=int(time.time()),
    )
    play_res = get_json(f"https://api.bilibili.com/x/player/wbi/playurl?{play_q}", cookies)
    durl = (play_res.get("data") or {}).get("durl") or []
    if not durl or not durl[0].get("url"):
        raise RuntimeError("未能获取到哔哩哔哩 MP4 视频流")

    video_url = durl[0]["url"]
    backups = durl[0].get("backup_url") or []

    return {
        "platform": "bilibili",
        "platformName": "哔哩哔哩 (Bilibili)",
        "videoId": bvid,
        "title": title,
        "author": author,
        "cover": cover,
        "duration": duration,
        "width": width,
        "height": height,
        "videoUrl": video_url,
        "backupUrls": backups[:3],
        "headers": {
            "User-Agent": DESKTOP_UA,
            "Referer": f"https://www.bilibili.com/video/{bvid}",
        },
    }


def parse_tiktok(url: str) -> dict[str, Any]:
    expanded = expand_short_url(url, ua=DESKTOP_UA)
    api_url = "https://www.tikwm.com/api/"
    post_data = urllib.parse.urlencode({"url": expanded, "hd": 1}).encode("utf-8")
    req = urllib.request.Request(
        api_url,
        data=post_data,
        headers={"User-Agent": DESKTOP_UA, "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        payload = json.loads(res.read().decode("utf-8", "replace"))

    if payload.get("code") == 0 and payload.get("data"):
        d = payload["data"]
        video_url = d.get("hdplay") or d.get("play") or d.get("wmplay")
        if video_url:
            return {
                "platform": "tiktok",
                "platformName": "TikTok",
                "videoId": str(d.get("id") or "tiktok"),
                "title": d.get("title") or "TikTok Video",
                "author": (d.get("author") or {}).get("nickname") or "TikTok Creator",
                "cover": d.get("cover") or "",
                "duration": float(d.get("duration") or 0),
                "width": 1080,
                "height": 1920,
                "videoUrl": video_url,
                "backupUrls": [u for u in (d.get("play"), d.get("wmplay")) if u and u != video_url],
                "headers": {"User-Agent": DESKTOP_UA, "Referer": "https://www.tiktok.com/"},
            }
    return parse_with_ytdlp(expanded, platform_label="TikTok")


def parse_xiaohongshu(url: str) -> dict[str, Any]:
    expanded = expand_short_url(url, ua=MOBILE_UA)
    req = urllib.request.Request(
        expanded,
        headers={
            "User-Agent": DESKTOP_UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", "replace")

    # Check og:video and og:title first
    og_video = re.search(r'<meta\s+name="og:video"\s+content="([^"]+)"', html) or re.search(
        r'<meta\s+property="og:video"\s+content="([^"]+)"', html
    )
    og_title = re.search(r'<meta\s+name="og:title"\s+content="([^"]+)"', html) or re.search(
        r"<title>([^<]+)</title>", html
    )
    og_cover = re.search(r'<meta\s+name="og:image"\s+content="([^"]+)"', html)

    master_urls = re.findall(r'"masterUrl"\s*:\s*"([^"]+)"', html)
    video_url = ""
    if master_urls:
        video_url = master_urls[0].encode("utf-8").decode("unicode_escape").replace("\\/", "/")
    elif og_video:
        video_url = og_video.group(1)

    if video_url:
        return {
            "platform": "xiaohongshu",
            "platformName": "小红书 (Xiaohongshu)",
            "videoId": str(int(time.time())),
            "title": (og_title.group(1) if og_title else "小红书视频").replace(" - 小红书", ""),
            "author": "小红书创作者",
            "cover": og_cover.group(1) if og_cover else "",
            "duration": 0,
            "width": 1080,
            "height": 1920,
            "videoUrl": video_url,
            "backupUrls": [],
            "headers": {"User-Agent": DESKTOP_UA, "Referer": "https://www.xiaohongshu.com/"},
        }
    return parse_with_ytdlp(expanded, platform_label="小红书 (Xiaohongshu)")


def parse_kuaishou(url: str) -> dict[str, Any]:
    expanded = expand_short_url(url, ua=MOBILE_UA)
    req = urllib.request.Request(expanded, headers={"User-Agent": MOBILE_UA})
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", "replace")

    mp4_match = re.search(r'"photoUrl"\s*:\s*"([^"]+)"', html) or re.search(
        r'"mp4Url"\s*:\s*"([^"]+)"', html
    )
    if mp4_match:
        video_url = mp4_match.group(1).encode("utf-8").decode("unicode_escape").replace("\\u002F", "/")
        title_m = re.search(r'"caption"\s*:\s*"([^"]+)"', html)
        return {
            "platform": "kuaishou",
            "platformName": "快手 (Kuaishou)",
            "videoId": str(int(time.time())),
            "title": title_m.group(1) if title_m else "快手无水印视频",
            "author": "快手创作者",
            "cover": "",
            "duration": 0,
            "width": 1080,
            "height": 1920,
            "videoUrl": video_url,
            "backupUrls": [],
            "headers": {"User-Agent": MOBILE_UA, "Referer": "https://www.kuaishou.com/"},
        }
    return parse_with_ytdlp(expanded, platform_label="快手 (Kuaishou)")


def parse_with_ytdlp(url: str, platform_label: str = "全网视频") -> dict[str, Any]:
    proc = subprocess.run(
        ["yt-dlp", "-J", "--no-playlist", "--no-warnings", url],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"视频解析失败: {proc.stderr.strip() or '不支持的链接或需要登录权限'}")

    info = json.loads(proc.stdout)
    video_url = info.get("url")
    if not video_url:
        formats = info.get("formats") or []
        mp4_formats = [
            f
            for f in formats
            if f.get("url")
            and f.get("ext") == "mp4"
            and f.get("vcodec") != "none"
            and f.get("acodec") != "none"
        ]
        if not mp4_formats:
            mp4_formats = [f for f in formats if f.get("url") and f.get("vcodec") != "none"]
        if mp4_formats:
            mp4_formats.sort(key=lambda f: (f.get("height") or 0, f.get("tbr") or 0), reverse=True)
            video_url = mp4_formats[0]["url"]

    if not video_url:
        raise RuntimeError("未能从该页面找到可直接下载的 MP4 视频流")

    return {
        "platform": info.get("extractor_key", "generic").lower(),
        "platformName": platform_label or info.get("extractor", "全网平台"),
        "videoId": str(info.get("id") or int(time.time())),
        "title": info.get("title") or "无水印视频",
        "author": info.get("uploader") or info.get("channel") or "创作者",
        "cover": info.get("thumbnail") or "",
        "duration": float(info.get("duration") or 0),
        "width": int(info.get("width") or 1280),
        "height": int(info.get("height") or 720),
        "videoUrl": video_url,
        "backupUrls": [],
        "headers": info.get("http_headers") or {"User-Agent": DESKTOP_UA},
    }


def parse_any_url(share_text: str) -> dict[str, Any]:
    url = extract_clean_url(share_text)
    if not url:
        raise RuntimeError("未检测到有效的视频链接。请粘贴抖音、TikTok、B站、小红书、快手或 MP4 视频链接。")

    platform = detect_platform(url)
    if platform == "direct":
        return {
            "platform": "direct",
            "platformName": "MP4 视频直链",
            "videoId": str(int(time.time())),
            "title": Path(urllib.parse.urlsplit(url).path).name or "直链视频.mp4",
            "author": "直链来源",
            "cover": "",
            "duration": 0,
            "width": 1280,
            "height": 720,
            "videoUrl": url,
            "backupUrls": [],
            "headers": {"User-Agent": DESKTOP_UA},
        }
    if platform == "douyin":
        return parse_douyin(url)
    if platform == "bilibili":
        return parse_bilibili(url)
    if platform == "tiktok":
        return parse_tiktok(url)
    if platform == "xiaohongshu":
        return parse_xiaohongshu(url)
    if platform == "kuaishou":
        return parse_kuaishou(url)
    return parse_with_ytdlp(url)


def download_video_file(parsed: dict[str, Any], output_path: Path) -> None:
    urls_to_try = [parsed["videoUrl"], *(parsed.get("backupUrls") or [])]
    headers = dict(parsed.get("headers") or {"User-Agent": DESKTOP_UA})
    last_error = None

    for candidate_url in urls_to_try:
        try:
            req = urllib.request.Request(candidate_url, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                total = 0
                with open(output_path, "wb") as f:
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            break
                        f.write(chunk)
                        total += len(chunk)
                if total > 1024:
                    return
                last_error = f"下载文件过小 ({total} bytes)"
        except Exception as e:
            last_error = str(e)

    raise RuntimeError(f"视频流下载失败: {last_error}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Multi-Platform Watermark-Free Video Parser & Downloader")
    parser.add_argument("--mode", choices=["parse", "download", "trending"], default="parse")
    parser.add_argument("--text", type=str, default="", help="Share text or URL")
    parser.add_argument("--output", type=Path, help="Output MP4 file path when mode=download")
    parser.add_argument("--count", type=int, default=6, help="Number of trending videos")
    args = parser.parse_args()

    try:
        if args.mode == "trending":
            items = fetch_douyin_trending_videos(count=args.count)
            print(json.dumps({"success": True, "items": items}, ensure_ascii=False))
            return 0

        parsed = parse_any_url(args.text)
        if args.mode == "download":
            if not args.output:
                raise ValueError("--output is required when --mode=download")
            download_video_file(parsed, args.output)
            parsed["downloadedPath"] = str(args.output.resolve())
            parsed["downloadedBytes"] = args.output.stat().st_size

        print(json.dumps({"success": True, "data": parsed}, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"success": False, "error": str(exc)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
