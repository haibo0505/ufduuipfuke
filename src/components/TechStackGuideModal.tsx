import React, { useState } from 'react';
import {
  X,
  Github,
  BookOpen,
  Code2,
  ExternalLink,
  Layers,
  Cpu,
  Scissors,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface TechGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechStackGuideModal: React.FC<TechGuideModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'douyin' | 'depth' | 'architecture'>('douyin');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm shadow">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                抖音去水印开源项目 & 深度视频转换架构方案
              </h3>
              <p className="text-xs text-slate-400">
                解析原理 · GitHub 推荐项目 · 微信小程序全链路生产部署
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            onClick={() => setTab('douyin')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition ${
              tab === 'douyin'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ✂️ GitHub 抖音免费去水印项目推荐
          </button>
          <button
            onClick={() => setTab('depth')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition ${
              tab === 'depth'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🧠 视频转深度视频算法 (Depth Anything v2)
          </button>
          <button
            onClick={() => setTab('architecture')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition ${
              tab === 'architecture'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏗️ 微信小程序 + 云端全链路落地架构
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-700 text-xs space-y-4">
          {tab === 'douyin' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-900">
                <div className="font-bold text-sm mb-1">精选 GitHub 热门可用抖音去水印开源项目</div>
                <p className="text-xs leading-relaxed opacity-90">
                  以下为您精选的 GitHub 开源去水印项目均拥有良好口碑和高星标，支持单一视频链接、批量主页与无水印视频流提取：
                </p>
              </div>

              {/* Project 1 */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      1. Douyin_TikTok_Download_API
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-semibold">
                      API 接口服务 (最推荐)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">FastAPI / Python</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  基于 FastAPI 开发的异步抖音 / TikTok 无水印下载与数据解析 API 服务。支持部署为纯后端微服务，微信小程序只需发起一条 <code>wx.request</code> 请求即可获取无水印高清视频直链。
                </p>
                <div className="font-mono text-[10px] bg-slate-900 text-slate-200 p-2.5 rounded-xl">
                  git clone https://github.com/Evil0ctal/Douyin_TikTok_Download_API.git
                </div>
              </div>

              {/* Project 2 */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">2. jiji262 / douyin-downloader</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full font-semibold">
                      全功能批量工具
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Python CLI</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  成熟稳定的抖音无水印下载工具，支持单个作品、图集、合集以及用户主页批量下载，内置请求重试和断点续传。
                </p>
              </div>

              {/* Technical Principle */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                <div className="font-bold text-slate-900 text-xs">🔍 核心去水印原理（3 步解析）：</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    <strong>重定向解析</strong>：请求短链接（如 <code>https://v.douyin.com/xxx/</code>），从 302 重定向后的 Location 中提取 <code>video_id</code>（如 73456789...）。
                  </li>
                  <li>
                    <strong>官方接口读取</strong>：携带移动端 User-Agent 请求官方数据接口：
                    <br />
                    <code>https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids={'{video_id}'}</code>
                  </li>
                  <li>
                    <strong>去除水印关键技巧</strong>：从返回 JSON 的 <code>item_list[0].video.play_addr.url_list[0]</code> 中，直接将播放地址中的 <code>playwm</code> 字符串替换为 <code>play</code>，即可得到官方无水印的原画高清视频流！
                  </li>
                </ol>
              </div>
            </div>
          )}

          {tab === 'depth' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-900">
                <div className="font-bold text-sm mb-1">
                  单目视频转 3D 深度视频 (Video Depth Estimation) 核心原理
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  深度视频是在每个 RGB 视频帧的基础上计算对应的像素级物理距离景深图，是 VR 头显（Vision Pro、Quest 3）、裸眼 3D 屏和空间计算的基石。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50">
                  <div className="font-bold text-slate-900 text-xs">① Depth Anything V2 深度估计</div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    基于高精度 ViT-S 编码器逐帧推理相对深度，边缘清晰，对透明、反射及复杂几何结构具备优秀的估计表现。
                  </p>
                </div>
                <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50">
                  <div className="font-bold text-slate-900 text-xs">② 全局归一化灰度 MP4 (供 Seedance)</div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    严格依据 <code>depth-video-skill</code> 算法，采用整段分位数稳定映射（近处亮、远处暗），生成兼容 H.264 的标准灰度深度视频。
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># Python 脚本调用：depth-video-skill/scripts/make_depth_video.py</div>
                <div>python3 make_depth_video.py --input /tmp/input.mp4 --output /tmp/depth.mp4</div>
                <div className="text-emerald-400"># 输出规格：H.264 yuv420p 灰度 MP4 (近亮远暗 0~255)</div>
              </div>
            </div>
          )}

          {tab === 'architecture' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-xs">
                  🚀 微信小程序端 + 云端 Python 推理全链路落地架构：
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong>微信小程序前端</strong>：使用 <code>wx.getClipboardData</code> 读取抖音链接口令，或通过 <code>wx.chooseMedia</code> 选择本地手机相册视频。
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong>云端服务层 (Node.js Express)</strong>：接收链接或文件上传，严格通过 ffprobe 校验编码、时长与有效流；发起后台 Python 推理任务。
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong>深度算法引擎 (Python + Depth Anything V2)</strong>：执行 <code>make_depth_video.py</code> 逐帧估计深度并归一化，FFmpeg 封装为灰度 H.264 MP4，实时向前端推送帧进度。
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong>微信小程序端下载与应用</strong>：调用 <code>wx.downloadFile</code> 与 <code>wx.saveVideoToPhotosAlbum</code> 保存视频至相册，即可直接导入 Seedance 或其他 AI 视频生成工具作为控制源！
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            完成阅读
          </button>
        </div>
      </div>
    </div>
  );
};
