import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Readable } from 'stream';
import {
  createUploadJob,
  createDouyinJob,
  createSampleJob,
  parseVideoLink,
  fetchTrendingDouyinVideos,
  getJob,
  listJobs,
  getPythonCommand,
  getScriptPath,
  getParserScriptPath,
  warmUpDepthEnvironment
} from './server/depthJobManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_TMP_DIR = process.env.DEPTH_UPLOADS_DIR || path.join(os.tmpdir(), 'depth-uploads');
if (!fs.existsSync(UPLOAD_TMP_DIR)) {
  fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_TMP_DIR,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv'];
    if (allowed.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持上传常见的视频文件 (MP4, MOV, WebM, M4V, AVI)'));
    }
  }
});

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function getPlatformReferer(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'douyin':
      return 'https://www.douyin.com/';
    case 'bilibili':
      return 'https://www.bilibili.com/';
    case 'tiktok':
      return 'https://www.tiktok.com/';
    case 'xiaohongshu':
      return 'https://www.xiaohongshu.com/';
    case 'kuaishou':
      return 'https://www.kuaishou.com/';
    default:
      return '';
  }
}

async function startServer() {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // API 1: Health check
  app.get('/api/health', (req, res) => {
    let pythonReady = false;
    let pythonVer = '';
    try {
      const pyCmd = getPythonCommand();
      pythonVer = execSync(`${pyCmd} --version`, { encoding: 'utf-8' }).trim();
      pythonReady = true;
    } catch {
      pythonReady = false;
    }

    let ffmpegReady = false;
    try {
      execSync('ffprobe -version', { stdio: 'ignore' });
      ffmpegReady = true;
    } catch {
      ffmpegReady = false;
    }

    const possibleModelPaths = [
      path.join(os.homedir(), '.cache', 'depth-video'),
      '/root/.cache/depth-video'
    ];
    let modelReady = false;
    for (const p of possibleModelPaths) {
      if (fs.existsSync(p)) {
        modelReady = true;
        break;
      }
    }

    const parserReady = fs.existsSync(getParserScriptPath());
    const samplePath = path.resolve(process.cwd(), 'public/sample_test.mp4');
    const sampleReady = fs.existsSync(samplePath);

    res.json({
      success: true,
      service: 'Douyin Watermark-Free & Depth Video Backend',
      engine: 'Evil0ctal/Douyin_TikTok_Download_API (ABogus+Websign) + Depth Anything V2 Small',
      pythonReady,
      pythonVersion: pythonVer,
      ffmpegReady,
      modelReady,
      parserReady,
      sampleReady,
      scriptPath: getScriptPath(),
      format: 'Watermark-Free 1080p/4K MP4 & H.264 Grayscale Relative-Depth MP4',
      supportedPlatforms: ['抖音 (Douyin)', 'TikTok', '哔哩哔哩 (Bilibili)', '小红书 (Xiaohongshu)', '快手 (Kuaishou)', 'MP4直链']
    });
  });

  // API 2: Parse Douyin / Multi-platform link to extract watermark-free video & metadata
  app.post('/api/parse', async (req, res) => {
    try {
      const { shareText, url } = req.body;
      const input = (shareText || url || '').trim();
      if (!input) {
        return res.status(400).json({ success: false, error: '请先粘贴抖音分享链接、口令或视频链接' });
      }

      const data = await parseVideoLink(input);
      res.json({ success: true, data });
    } catch (err: any) {
      console.error('Parse video link error:', err);
      res.status(400).json({
        success: false,
        error: err.message || '抖音/全网视频去水印解析失败，请确认链接有效且为公开作品'
      });
    }
  });

  // API 3: Fetch real live Douyin trending videos for 1-click watermark removal testing
  app.get('/api/douyin/trending', async (req, res) => {
    try {
      const refresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const items = await fetchTrendingDouyinVideos(6, refresh);
      res.json({ success: true, items });
    } catch (err: any) {
      console.error('Fetch trending Douyin error:', err);
      res.status(500).json({ success: false, error: err.message || '获取抖音实时测试视频失败', items: [] });
    }
  });

  // API 4: Proxy watermark-free video stream or attachment download (bypasses CDN Referer 403)
  app.get('/api/proxy-video', async (req, res) => {
    const targetUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const platform = typeof req.query.platform === 'string' ? req.query.platform : 'douyin';
    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const filename = typeof req.query.filename === 'string' ? req.query.filename : `douyin_nowatermark_${Date.now()}.mp4`;

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).send('无效的视频流地址');
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': DESKTOP_UA
      };
      const referer = getPlatformReferer(platform);
      if (referer) {
        headers['Referer'] = referer;
      }
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers,
        redirect: 'follow'
      });

      if (!upstream.ok && upstream.status !== 206) {
        return res.status(upstream.status).send(`上游视频流请求失败 (HTTP ${upstream.status})`);
      }

      res.status(upstream.status);
      const contentType = upstream.headers.get('content-type') || 'video/mp4';
      res.setHeader('Content-Type', contentType.includes('video') ? contentType : 'video/mp4');

      const contentLength = upstream.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }
      res.setHeader('Accept-Ranges', 'bytes');

      if (isDownload) {
        const encodedName = encodeURIComponent(filename);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="video_clean.mp4"; filename*=UTF-8''${encodedName}`
        );
      }

      if (upstream.body) {
        const nodeStream = Readable.fromWeb(upstream.body as any);
        nodeStream.on('error', () => {
          if (!res.headersSent) res.status(500).end();
          else res.end();
        });
        nodeStream.pipe(res);
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.end(buf);
      }
    } catch (err: any) {
      console.error('Proxy video stream error:', err);
      if (!res.headersSent) {
        res.status(500).send(`视频流代理错误: ${err.message}`);
      }
    }
  });

  // API 5: Proxy cover/note images
  app.get('/api/proxy-image', async (req, res) => {
    const targetUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const platform = typeof req.query.platform === 'string' ? req.query.platform : 'douyin';
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).send('无效的图片地址');
    }
    try {
      const headers: Record<string, string> = { 'User-Agent': DESKTOP_UA };
      const referer = getPlatformReferer(platform);
      if (referer) headers['Referer'] = referer;

      const upstream = await fetch(targetUrl, { headers, redirect: 'follow' });
      if (!upstream.ok) {
        return res.status(upstream.status).send('图片加载失败');
      }
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch {
      res.status(500).send('图片代理失败');
    }
  });

  // API 6: Upload local video & create depth job
  app.post('/api/jobs/upload', upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: '请上传有效的视频文件' });
      }

      const inputSize = req.body.inputSize ? parseInt(req.body.inputSize, 10) : 256;
      const keepAudio = req.body.keepAudio === 'true' || req.body.keepAudio === true;
      const maxFrames = req.body.maxFrames !== undefined ? parseInt(req.body.maxFrames, 10) : 0;

      const job = await createUploadJob(req.file, { inputSize, keepAudio, maxFrames });
      res.json({ success: true, job });
    } catch (err: any) {
      console.error('Upload job creation failed:', err);
      res.status(500).json({ success: false, error: err.message || '创建视频任务失败' });
    }
  });

  // API 7: Submit Douyin link or direct video link & create depth job
  app.post('/api/jobs/douyin', async (req, res) => {
    try {
      const { shareText, url, inputSize, keepAudio, maxFrames } = req.body;
      const input = (shareText || url || '').trim();
      if (!input) {
        return res.status(400).json({ success: false, error: '请输入有效的抖音分享内容或视频链接' });
      }

      const job = await createDouyinJob(input, {
        inputSize: inputSize ? parseInt(inputSize, 10) : 256,
        keepAudio: Boolean(keepAudio),
        maxFrames: maxFrames !== undefined ? parseInt(maxFrames, 10) : 60
      });
      res.json({ success: true, job });
    } catch (err: any) {
      console.error('Douyin job creation failed:', err);
      res.status(500).json({ success: false, error: err.message || '解析抖音任务失败' });
    }
  });

  // API 8: 1-Click sample video job creation
  app.post('/api/jobs/sample', async (req, res) => {
    try {
      const samplePath = path.resolve(process.cwd(), 'public/sample_test.mp4');
      if (!fs.existsSync(samplePath)) {
        return res.status(404).json({ success: false, error: '服务器样例视频文件不存在' });
      }

      const inputSize = req.body.inputSize ? parseInt(req.body.inputSize, 10) : 256;
      const keepAudio = Boolean(req.body.keepAudio);

      const job = await createSampleJob(samplePath, { inputSize, keepAudio });
      res.json({ success: true, job });
    } catch (err: any) {
      console.error('Sample job creation failed:', err);
      res.status(500).json({ success: false, error: err.message || '创建样例任务失败' });
    }
  });

  // API 9: Get sample video stream
  app.get('/api/sample-video', (req, res) => {
    const samplePath = path.resolve(process.cwd(), 'public/sample_test.mp4');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).send('样例视频不存在');
    }
    res.sendFile(samplePath);
  });

  // API 10: Get job status and real progress
  app.get('/api/jobs/:id', (req, res) => {
    const job = getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: '未找到该任务' });
    }
    res.json({ success: true, job });
  });

  // API 11: List recent jobs
  app.get('/api/jobs', (req, res) => {
    res.json({ success: true, jobs: listJobs() });
  });

  // API 12: Download generated depth MP4
  app.get('/api/jobs/:id/download', (req, res) => {
    const job = getJob(req.params.id);
    if (!job || !fs.existsSync(job.outputPath)) {
      return res.status(404).send('深度视频文件不存在或尚未生成完成');
    }
    const cleanName = job.sourceName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_').slice(0, 50);
    const filename = `${cleanName}_depth.mp4`;
    res.download(job.outputPath, filename);
  });

  // API 13: Download watermark-free source MP4 from a job
  app.get('/api/jobs/:id/download-source', (req, res) => {
    const job = getJob(req.params.id);
    if (!job || !fs.existsSync(job.sourcePath)) {
      return res.status(404).send('无水印原视频文件不存在');
    }
    const cleanName = job.sourceName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_').slice(0, 50);
    const filename = `${cleanName}_无水印.mp4`;
    res.download(job.sourcePath, filename);
  });

  // API 14: Stream generated depth MP4 for video player
  app.get('/api/jobs/:id/depth-video', (req, res) => {
    const job = getJob(req.params.id);
    if (!job || !fs.existsSync(job.outputPath)) {
      return res.status(404).send('深度视频流不可用');
    }
    res.sendFile(job.outputPath);
  });

  // API 15: Stream source video for side-by-side comparison
  app.get('/api/jobs/:id/source-video', (req, res) => {
    const job = getJob(req.params.id);
    if (!job || !fs.existsSync(job.sourcePath)) {
      return res.status(404).send('原始视频流不可用');
    }
    res.sendFile(job.sourcePath);
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    warmUpDepthEnvironment();
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
