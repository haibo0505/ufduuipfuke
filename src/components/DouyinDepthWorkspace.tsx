import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Link2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileVideo,
  Film,
  Sparkles,
  Server,
  Terminal,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Scissors,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Flame
} from 'lucide-react';

export interface BackendHealth {
  success: boolean;
  service: string;
  engine: string;
  pythonReady: boolean;
  pythonVersion?: string;
  ffmpegReady: boolean;
  modelReady: boolean;
  parserReady?: boolean;
  sampleReady?: boolean;
  scriptPath?: string;
  format: string;
  supportedPlatforms?: string[];
}

export interface ParsedVideoInfo {
  platform: string;
  platformName: string;
  engine?: string;
  videoId: string;
  title: string;
  author: string;
  cover: string;
  duration: number;
  width: number;
  height: number;
  videoUrl: string;
  backupUrls: string[];
  images?: string[];
  headers: Record<string, string>;
  shareUrl?: string;
  proxyPlayUrl?: string;
  proxyDownloadUrl?: string;
  proxyCoverUrl?: string;
}

export interface JobData {
  id: string;
  sourceType: 'upload' | 'douyin' | 'sample';
  sourceName: string;
  sourceUrl?: string;
  status:
    | 'queued'
    | 'parsing'
    | 'downloading'
    | 'model_loading'
    | 'depth_estimation'
    | 'encoding'
    | 'completed'
    | 'failed';
  stageText: string;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  error?: string;
  inputSize: number;
  keepAudio: boolean;
  maxFrames?: number;
  parsedInfo?: ParsedVideoInfo;
  metadata?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    sizeBytes: number;
    codec: string;
  };
  outputMetadata?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    sizeBytes: number;
    codec: string;
  };
}

interface WorkspaceProps {
  onShowToast: (msg: string) => void;
  onOpenMiniProgram?: () => void;
  onSelectMiniProgramPage?: (pageId: string) => void;
}

export const DouyinDepthWorkspace: React.FC<WorkspaceProps> = ({
  onShowToast
}) => {
  // Mode tabs: 'douyin' (Douyin/Multi-platform watermark remover) vs 'upload' (Local video to Depth MP4)
  const [inputMode, setInputMode] = useState<'douyin' | 'upload'>('douyin');

  // Input states
  const [douyinText, setDouyinText] = useState(
    '7.15 复制打开抖音，看看【克瑞巴】的作品 双子座和精神病唯一的区别是… https://www.douyin.com/video/7684905495467991014'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  // Watermark removal states
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedVideo, setParsedVideo] = useState<ParsedVideoInfo | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Live Douyin trending test videos
  const [trendingVideos, setTrendingVideos] = useState<ParsedVideoInfo[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Depth model settings
  const [inputSize, setInputSize] = useState<number>(256); // 256 or 518
  const [keepAudio, setKeepAudio] = useState<boolean>(false);
  const [maxFrames, setMaxFrames] = useState<number>(60); // 60 frames (~2s) default for fast CPU experience, 0 for full

  // Job and health states
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobData | null>(null);

  // Code Guide Collapsible State
  const [showCodeGuide, setShowCodeGuide] = useState(false);

  // Polling ref
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkHealth();
    loadTrendingDouyin(false);
    handleParseWatermarkFree();

    const savedJobId = localStorage.getItem('depth_active_job_id');
    if (savedJobId) {
      fetch(`/api/jobs/${savedJobId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json && json.success && json.job) {
            setCurrentJob(json.job);
          }
        })
        .catch(() => {});
    }
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`后端健康检查失败: HTTP ${res.status}`);
      }
      const data: BackendHealth = await res.json();
      setHealth(data);
      if (!data.modelReady) {
        setHealthError('Depth Anything V2 模型权重正在初始化');
      } else {
        setHealthError(null);
      }
    } catch (err: any) {
      setHealthError(err.message || '后端服务未连接');
    }
  };

  const loadTrendingDouyin = async (refresh = false) => {
    try {
      setLoadingTrending(true);
      const res = await fetch(`/api/douyin/trending${refresh ? '?refresh=1' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.items)) {
          setTrendingVideos(json.items);
          if (refresh) {
            onShowToast(`已从抖音官方实时拉取 ${json.items.length} 条最新视频`);
          }
        }
      }
    } catch {
      // ignore trending fetch error silently
    } finally {
      setLoadingTrending(false);
    }
  };

  // Poll current depth job status
  useEffect(() => {
    if (!currentJob) return;

    if (currentJob.status === 'completed' || currentJob.status === 'failed') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${currentJob.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.job) {
            setCurrentJob(json.job);
            if (json.job.status === 'completed') {
              onShowToast('🎉 灰度深度视频生成成功！可直接播放与下载');
            } else if (json.job.status === 'failed') {
              onShowToast(`处理失败: ${json.job.error || '未知错误'}`);
            }
          }
        }
      } catch (e) {
        console.error('Job polling error:', e);
      }
    }, 1200);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentJob?.id, currentJob?.status]);

  // Mode A Primary Action: Parse Douyin / Multi-platform link to remove watermark & download MP4
  const handleParseWatermarkFree = async (customText?: string) => {
    const textToParse = (customText ?? douyinText).trim();
    if (!textToParse) {
      onShowToast('请先粘贴抖音分享口令或视频链接');
      return;
    }

    try {
      setIsParsing(true);
      setParseError(null);
      onShowToast('正在调用 Evil0ctal 开源签名算法解析无水印原画视频...');

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareText: textToParse })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setParsedVideo(json.data);
        onShowToast(`✅ 去水印解析成功！已获取 ${json.data.platformName} 原画无水印 MP4`);
      } else {
        setParseError(json.error || '去水印解析失败，请确认链接为公开可访问视频');
        onShowToast(json.error || '去水印解析失败');
      }
    } catch (err: any) {
      const msg = err.message || '网络请求失败';
      setParseError(msg);
      onShowToast(`解析异常: ${msg}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      onShowToast('视频大小超出 200MB 限制');
      return;
    }

    setSelectedFile(file);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    onShowToast(`已选中视频: ${file.name}`);
  };

  // Load server-side sample video into local file selector
  const handleLoadSampleForUpload = async () => {
    try {
      onShowToast('正在载入服务器样例测试视频...');
      const res = await fetch('/api/sample-video');
      if (!res.ok) {
        throw new Error('样例视频未就绪');
      }
      const blob = await res.blob();
      const file = new File([blob], 'sample_test.mp4', { type: 'video/mp4' });
      setSelectedFile(file);
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
      setFilePreviewUrl(URL.createObjectURL(file));
      onShowToast('已自动载入样例视频！点击「开始真实深度转换」即可体验');
    } catch (err: any) {
      onShowToast(`载入样例失败: ${err.message}`);
    }
  };

  // 1-Click sample depth processing
  const handleRunSampleJob = async () => {
    try {
      setIsSubmitting(true);
      onShowToast('正在向深度引擎提交测试视频...');
      const res = await fetch('/api/jobs/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputSize, keepAudio })
      });
      const json = await res.json();
      if (json.success && json.job) {
        localStorage.setItem('depth_active_job_id', json.job.id);
        setCurrentJob(json.job);
        onShowToast('测试任务已启动，正在运行 Depth Anything V2 逐帧推理...');
      } else {
        onShowToast(json.error || '创建样例任务失败');
      }
    } catch (err: any) {
      onShowToast(`提交异常: ${err.message || '网络连接错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit local video upload job
  const handleStartUploadJob = async () => {
    if (!selectedFile) {
      onShowToast('请先选择一个本地视频文件');
      return;
    }

    try {
      setIsSubmitting(true);
      onShowToast('正在上传视频并提交深度处理任务...');

      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('inputSize', String(inputSize));
      formData.append('keepAudio', String(keepAudio));
      formData.append('maxFrames', String(maxFrames));

      const res = await fetch('/api/jobs/upload', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.success && json.job) {
        localStorage.setItem('depth_active_job_id', json.job.id);
        setCurrentJob(json.job);
        onShowToast('任务提交成功，正在运行 Depth Anything V2...');
      } else {
        onShowToast(json.error || '创建任务失败');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(`提交异常: ${err.message || '网络连接错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert parsed Douyin / link video into Grayscale Depth Video
  const handleStartDouyinDepthJob = async (overrideText?: string) => {
    const targetText = (overrideText ?? douyinText).trim();
    if (!targetText) {
      onShowToast('请先输入或粘贴抖音分享链接');
      return;
    }

    try {
      setIsSubmitting(true);
      onShowToast('正在下载无水印视频并送入 Depth Anything V2 转为深度视频...');

      const res = await fetch('/api/jobs/douyin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareText: targetText,
          inputSize,
          keepAudio,
          maxFrames
        })
      });

      const json = await res.json();
      if (json.success && json.job) {
        localStorage.setItem('depth_active_job_id', json.job.id);
        setCurrentJob(json.job);
        onShowToast('已启动无水印下载与 Depth Anything V2 深度转换队列');
      } else {
        onShowToast(json.error || '提交失败');
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(`网络异常: ${err.message || '提交失败'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetCurrentJob = () => {
    localStorage.removeItem('depth_active_job_id');
    setCurrentJob(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`已复制 ${label} 到剪贴板`);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Engine Status Bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-xs text-slate-600 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Server className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">双核开源引擎就绪：</span>
          {health?.pythonReady ? (
            <>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>去水印引擎：Evil0ctal/Douyin_TikTok_Download_API (ABogus + Websign)</span>
              </span>
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full font-medium border border-indigo-200">
                <span>深度引擎：Depth Anything V2 Small ({health.pythonVersion || 'Python 3.11'})</span>
              </span>
            </>
          ) : healthError ? (
            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{healthError}</span>
            </span>
          ) : (
            <span className="text-slate-400">正在检查后端环境...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunSampleJob}
            disabled={Boolean(isSubmitting || (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed'))}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold transition"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>一键测试深度视频生成</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Mode Workspace Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setInputMode('douyin')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                inputMode === 'douyin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>方式 A：复制抖音/全网链接一键去水印下载</span>
            </button>
            <button
              onClick={() => setInputMode('upload')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                inputMode === 'upload'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>方式 B：上传本地视频转灰度深度视频</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-700">支持平台：</span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-semibold">抖音 Douyin</span>
            <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md font-semibold">TikTok</span>
            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md font-semibold">哔哩哔哩 B站</span>
            <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-md font-semibold">小红书</span>
            <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md font-semibold">快手</span>
          </div>
        </div>

        {/* Mode A: Douyin & Multi-Platform Watermark Remover & Downloader */}
        {inputMode === 'douyin' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs font-bold text-slate-800">
                  粘贴抖音分享口令、短链接 (v.douyin.com) 或 B站 / TikTok / 小红书 / 快手视频链接：
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const u = '7.15 复制打开抖音，看看【克瑞巴】的作品 https://www.douyin.com/video/7684905495467991014';
                      setDouyinText(u);
                      handleParseWatermarkFree(u);
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition"
                  >
                    填入抖音实测链接
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const u = 'https://www.bilibili.com/video/BV1GxsX6YEuP';
                      setDouyinText(u);
                      handleParseWatermarkFree(u);
                    }}
                    className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-semibold transition"
                  >
                    填入B站实测链接
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const u = 'https://www.tiktok.com/@tiktok/video/7693137414587485446';
                      setDouyinText(u);
                      handleParseWatermarkFree(u);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-semibold transition"
                  >
                    填入TikTok实测链接
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  value={douyinText}
                  onChange={(e) => setDouyinText(e.target.value)}
                  placeholder="直接粘贴从抖音 App 复制的分享文本，例如：7.15 复制打开抖音，看看【xxx】的作品 https://v.douyin.com/xxxxxx/"
                  className="w-full p-3.5 pr-36 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 resize-none bg-slate-50/40"
                />
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  {douyinText && (
                    <button
                      type="button"
                      onClick={() => {
                        setDouyinText('');
                        setParseError(null);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[11px] font-medium"
                    >
                      清空
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setDouyinText(text);
                          onShowToast('已读取剪贴板内容');
                        }
                      } catch {
                        onShowToast('请直接在输入框按 Ctrl+V 粘贴');
                      }
                    }}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold"
                  >
                    粘贴剪贴板
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  基于 GitHub 开源项目 <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">Evil0ctal/Douyin_TikTok_Download_API</code> 改造，内置 ABogus + Websign 签名算法与无头浏览器自动续签
                </span>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleParseWatermarkFree()}
                  disabled={isParsing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{isParsing ? '正在解析无水印视频流...' : '✂️ 一键去水印解析并下载视频'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartDouyinDepthJob()}
                  disabled={Boolean(isSubmitting || (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed'))}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>去水印并转为灰度深度视频</span>
                </button>
              </div>
            </div>

            {/* Live Douyin Trending Videos Bar for 1-Click Real Testing */}
            {trendingVideos.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    <span>抖音官方实时视频流（点击任意视频即可一键测试去水印下载）：</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadTrendingDouyin(true)}
                    disabled={loadingTrending}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingTrending ? 'animate-spin' : ''}`} />
                    <span>{loadingTrending ? '刷新中...' : '换一批实时抖音视频'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {trendingVideos.slice(0, 6).map((item) => (
                    <button
                      key={item.videoId}
                      type="button"
                      onClick={() => {
                        const shareLink = item.shareUrl || `https://www.douyin.com/video/${item.videoId}`;
                        setDouyinText(shareLink);
                        setParsedVideo(item);
                        setParseError(null);
                        onShowToast(`已解析【@${item.author}】的无水印原画视频，可直接播放或下载！`);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                        parsedVideo?.videoId === item.videoId
                          ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                          : 'bg-white hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>@{item.author}</span>
                          <span>·</span>
                          <span>{item.width}×{item.height}</span>
                          <span>·</span>
                          <span>{item.duration}s</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold flex-shrink-0">
                        一键去水印
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Parse Error Alert */}
            {parseError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="font-bold">去水印解析失败：</div>
                  <div>{parseError}</div>
                </div>
              </div>
            )}

            {/* Parsed Watermark-Free Video Result Card */}
            {parsedVideo && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>无水印原画解析成功</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold">
                      {parsedVideo.platformName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {parsedVideo.videoId}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    解析引擎：{parsedVideo.engine || 'Evil0ctal/Douyin_TikTok_Download_API'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Left: Watermark-free video player */}
                  <div className="md:col-span-5 bg-black rounded-2xl overflow-hidden border border-slate-800">
                    <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-400">▶ 无水印原画视频预览</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {parsedVideo.width}×{parsedVideo.height}
                        {parsedVideo.duration ? ` · ${parsedVideo.duration}s` : ''}
                      </span>
                    </div>
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <video
                        key={parsedVideo.videoUrl}
                        src={parsedVideo.proxyPlayUrl || parsedVideo.videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain max-h-[320px]"
                      />
                    </div>
                  </div>

                  {/* Right: Metadata & Direct Download Actions */}
                  <div className="md:col-span-7 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-2.5">
                      <div className="text-sm font-bold text-white leading-snug">
                        {parsedVideo.title}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                        <span className="bg-slate-800 px-2.5 py-1 rounded-lg">
                          作者：<strong>@{parsedVideo.author}</strong>
                        </span>
                        <span className="bg-slate-800 px-2.5 py-1 rounded-lg">
                          分辨率：<strong>{parsedVideo.width} × {parsedVideo.height}</strong>
                        </span>
                        {parsedVideo.duration > 0 && (
                          <span className="bg-slate-800 px-2.5 py-1 rounded-lg">
                            时长：<strong>{parsedVideo.duration} 秒</strong>
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1">
                        <div className="text-[11px] text-slate-400 font-semibold">无水印 CDN 源视频流地址：</div>
                        <div className="text-[11px] text-slate-300 font-mono break-all line-clamp-2">
                          {parsedVideo.videoUrl}
                        </div>
                      </div>
                    </div>

                    {/* Primary Download & Secondary Buttons */}
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <a
                          href={parsedVideo.proxyDownloadUrl}
                          download
                          onClick={() => onShowToast('正在开始下载无水印原画 MP4 视频...')}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition"
                        >
                          <Download className="w-4 h-4" />
                          <span>⬇️ 直接下载无水印 MP4 视频</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(parsedVideo.videoUrl);
                            setCopiedUrl(true);
                            onShowToast('已复制无水印视频 CDN 直链');
                            setTimeout(() => setCopiedUrl(false), 2000);
                          }}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUrl ? '已复制直链' : '复制无水印直链'}</span>
                        </button>

                        {parsedVideo.proxyCoverUrl && (
                          <a
                            href={parsedVideo.proxyCoverUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>查看高清封面</span>
                          </a>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] text-slate-400">
                          需要将此无水印视频进一步转换为 Seedance 灰度相对深度控制视频？
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleStartDouyinDepthJob(
                              parsedVideo.shareUrl ||
                                (parsedVideo.platform === 'douyin'
                                  ? `https://www.douyin.com/video/${parsedVideo.videoId}`
                                  : parsedVideo.videoUrl)
                            )
                          }
                          disabled={Boolean(isSubmitting || (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed'))}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>将此视频转为灰度深度 MP4</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode B: Local File Upload to Grayscale Depth Video */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 flex-wrap gap-3 text-xs">
              <div className="font-semibold text-slate-700">
                Depth Anything V2 灰度深度转换参数配置：
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">推理分辨率:</span>
                  <select
                    value={inputSize}
                    onChange={(e) => setInputSize(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value={256}>256px (CPU 快速推理 · 推荐)</option>
                    <option value={518}>518px (高精度推理)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">处理帧数上限:</span>
                  <select
                    value={maxFrames}
                    onChange={(e) => setMaxFrames(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value={60}>前 60 帧 (约2秒 · 极速生成)</option>
                    <option value={150}>前 150 帧 (约5秒)</option>
                    <option value={0}>全片完整帧数 (不限帧数)</option>
                  </select>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={keepAudio}
                    onChange={(e) => setKeepAudio(e.target.checked)}
                    className="rounded accent-blue-600"
                  />
                  <span>保留原视频音轨</span>
                </label>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-6 text-center transition">
              <label className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-2">
                  <FileVideo className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-800 text-xs">
                  {selectedFile ? `已选中文件：${selectedFile.name}` : '点击或拖拽上传本地视频文件 (或刚才去水印下载的 MP4)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  支持格式：MP4, MOV, WebM, M4V (大小限制 200MB，真实通过 Depth Anything V2 逐帧生成 H.264 灰度深度视频)
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLoadSampleForUpload}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>一键载入测试样例视频进行上传验证</span>
              </button>

              {selectedFile && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Film className="w-4 h-4 text-blue-600" />
                    <span>{selectedFile.name}</span>
                    <span className="text-slate-400 text-[11px]">
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={handleStartUploadJob}
                    disabled={Boolean(isSubmitting || (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed'))}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                  >
                    {isSubmitting ? '上传并处理中...' : '开始真实深度转换'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real Depth Job Execution Progress Panel */}
      {currentJob && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {currentJob.id}
              </span>
              <h3 className="font-bold text-sm text-slate-100">{currentJob.sourceName}</h3>
            </div>

            <div className="flex items-center gap-2">
              {currentJob.status === 'completed' ? (
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 深度转换完成
                </span>
              ) : currentJob.status === 'failed' ? (
                <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 任务失败
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" /> 正在处理中
                </span>
              )}

              <button
                onClick={handleResetCurrentJob}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              >
                关闭任务面板
              </button>
            </div>
          </div>

          {/* Progress Bar & Stage Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-300">{currentJob.stageText}</span>
              <span className="font-bold text-blue-400">{currentJob.progress}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  currentJob.status === 'completed'
                    ? 'bg-emerald-500'
                    : currentJob.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${Math.max(4, currentJob.progress)}%` }}
              />
            </div>

            {currentJob.totalFrames > 0 && (
              <div className="text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <span>
                  当前帧进度: {currentJob.currentFrame} / {currentJob.totalFrames} 帧
                </span>
                <span>
                  算法: Depth Anything V2 Small · 尺度 {currentJob.inputSize}px
                  {currentJob.maxFrames && currentJob.maxFrames > 0 ? ` · 限制前 ${currentJob.maxFrames} 帧加速` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Failure Banner & Actionable Retry */}
          {currentJob.status === 'failed' && (
            <div className="bg-red-950/60 border border-red-800/80 rounded-2xl p-4 text-xs space-y-3 text-red-200">
              <div className="font-bold flex items-center gap-1.5 text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>任务执行失败说明：</span>
              </div>
              <p className="leading-relaxed text-red-200/90">{currentJob.error}</p>
              <div className="flex gap-2 pt-1 flex-wrap">
                <button
                  onClick={handleRunSampleJob}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  使用测试样例视频立即重试
                </button>
                <button
                  onClick={handleResetCurrentJob}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
                >
                  关闭
                </button>
              </div>
            </div>
          )}

          {/* Dual-Video Comparison View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: Source Video Player */}
            <div className="bg-black rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">① 无水印原始输入视频 (Source)</span>
                {currentJob.metadata && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentJob.metadata.width}×{currentJob.metadata.height} · {currentJob.metadata.fps} FPS · {formatFileSize(currentJob.metadata.sizeBytes)}
                  </span>
                )}
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
                <video
                  src={`/api/jobs/${currentJob.id}/source-video`}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Right: Generated Grayscale Depth MP4 Player */}
            <div className="bg-black rounded-2xl overflow-hidden border border-blue-500/40 flex flex-col">
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-300">② 生成的灰度深度视频 (Depth MP4)</span>
                {currentJob.outputMetadata && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    H.264 灰度 · {currentJob.outputMetadata.width}×{currentJob.outputMetadata.height} · {formatFileSize(currentJob.outputMetadata.sizeBytes)}
                  </span>
                )}
              </div>

              <div className="aspect-video bg-black flex items-center justify-center relative">
                {currentJob.status === 'completed' ? (
                  <video
                    src={`/api/jobs/${currentJob.id}/depth-video`}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto animate-spin text-slate-600" />
                    <div className="text-xs font-semibold text-slate-400">
                      正在进行 Depth Anything V2 深度估计计算，请稍候...
                    </div>
                    <div className="text-[11px] text-slate-600">
                      逐帧计算相对深度并统一分位数归一化（近亮远暗）
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Action Bar (Only when completed) */}
          {currentJob.status === 'completed' && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-emerald-300">
                  ✓ 灰度深度视频已生成且通过 H.264 与近亮远暗校验
                </div>
                <div className="text-[11px] text-slate-400">
                  文件大小: {formatFileSize(currentJob.outputMetadata?.sizeBytes)} · 统一时序无闪烁 · 专供 Seedance / AI 视频工具使用
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`/api/jobs/${currentJob.id}/download-source`}
                  download
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>下载无水印原视频 MP4</span>
                </a>
                <a
                  href={`/api/jobs/${currentJob.id}/download`}
                  download
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>下载灰度深度 MP4</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Local Computer & Code Usage Guide Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <button
          onClick={() => setShowCodeGuide(!showCodeGuide)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2 text-slate-800">
            <Terminal className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-xs">
              💻 电脑代码端运行与开源项目调用指南 (Evil0ctal 去水印脚本 + Depth Anything V2 脚本)
            </h4>
          </div>
          {showCodeGuide ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showCodeGuide && (
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-4">
            <p className="leading-relaxed">
              本项目已将 GitHub 开源项目 <strong>Evil0ctal/Douyin_TikTok_Download_API</strong> 的核心签名模块（<code>backend/dtk/signing/native</code>：<code>abogus.py</code>, <code>websign.py</code>, <code>wbi.py</code>）与您的 <strong>haibo0505/depth-video-skill</strong> 完整整合在 <code>backend/</code> 目录下：
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>1. 命令行直接解析并下载抖音/全网无水印视频</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'python3 backend/video_parser.py --mode download --text "https://www.douyin.com/video/7684905495467991014" --output clean.mp4',
                      '去水印下载命令'
                    )
                  }
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                python3 backend/video_parser.py --mode download --text &quot;https://www.douyin.com/video/7684905495467991014&quot; --output clean.mp4
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>2. 命令行将下载好的无水印视频转为 H.264 灰度深度视频</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'python3 backend/depth-video-skill/scripts/make_depth_video.py --input clean.mp4 --output depth.mp4 --input-size 256',
                      '深度视频转换命令'
                    )
                  }
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                python3 backend/depth-video-skill/scripts/make_depth_video.py --input clean.mp4 --output depth.mp4 --input-size 256
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>3. 通过 HTTP API 调用抖音去水印解析接口</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'curl -X POST -H "Content-Type: application/json" -d \'{"shareText":"https://www.douyin.com/video/7684905495467991014"}\' http://localhost:3000/api/parse',
                      'API 解析命令'
                    )
                  }
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                curl -X POST -H &quot;Content-Type: application/json&quot; -d &apos;{JSON.stringify({ shareText: 'https://www.douyin.com/video/7684905495467991014' })}&apos; http://localhost:3000/api/parse
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
