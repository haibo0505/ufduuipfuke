import { spawn, exec, execSync, execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export type JobStatus =
  | 'queued'
  | 'parsing'
  | 'downloading'
  | 'model_loading'
  | 'depth_estimation'
  | 'encoding'
  | 'completed'
  | 'failed';

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  duration: number;
  sizeBytes: number;
  codec: string;
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

export interface DepthJob {
  id: string;
  sourceType: 'upload' | 'douyin' | 'sample';
  sourceName: string;
  sourceUrl?: string;
  sourcePath: string;
  outputPath: string;
  status: JobStatus;
  stageText: string;
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
  inputSize: number;
  keepAudio: boolean;
  maxFrames?: number;
  metadata?: VideoMetadata;
  outputMetadata?: VideoMetadata;
  parsedInfo?: ParsedVideoInfo;
}

// Cross-platform job storage directory
export const JOBS_STORAGE_DIR = process.env.DEPTH_JOBS_DIR || path.join(os.tmpdir(), 'depth-jobs');
if (!fs.existsSync(JOBS_STORAGE_DIR)) {
  fs.mkdirSync(JOBS_STORAGE_DIR, { recursive: true });
}

// In-memory job registry
const jobs = new Map<string, DepthJob>();

export function getJob(id: string): DepthJob | undefined {
  return jobs.get(id);
}

export function listJobs(): DepthJob[] {
  return Array.from(jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Finds the Python command available on the host (python3 on Unix, python on Windows)
 */
export function getPythonCommand(): string {
  try {
    execSync('python3 --version', { stdio: 'ignore' });
    return 'python3';
  } catch {
    try {
      execSync('python --version', { stdio: 'ignore' });
      return 'python';
    } catch {
      return 'python3';
    }
  }
}

/**
 * Resolves the path to make_depth_video.py dynamically
 */
export function getScriptPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'backend/depth-video-skill/scripts/make_depth_video.py'),
    path.resolve(__dirname, '../backend/depth-video-skill/scripts/make_depth_video.py'),
    path.resolve('/app/applet/backend/depth-video-skill/scripts/make_depth_video.py')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return candidates[0];
}

/**
 * Resolves the path to video_parser.py dynamically
 */
export function getParserScriptPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'backend/video_parser.py'),
    path.resolve(__dirname, '../backend/video_parser.py'),
    path.resolve('/app/applet/backend/video_parser.py')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return candidates[0];
}

/**
 * Attaches proxy stream & download URLs to a ParsedVideoInfo object
 */
export function attachProxyUrls(info: ParsedVideoInfo): ParsedVideoInfo {
  const encodedUrl = encodeURIComponent(info.videoUrl);
  const encodedPlatform = encodeURIComponent(info.platform || 'douyin');
  const safeTitle = (info.title || `${info.platform}_${info.videoId}`)
    .replace(/[\\/:*?"<>|\r\n]+/g, '_')
    .slice(0, 60);
  const encodedFilename = encodeURIComponent(`${safeTitle}_无水印.mp4`);

  return {
    ...info,
    proxyPlayUrl: `/api/proxy-video?url=${encodedUrl}&platform=${encodedPlatform}`,
    proxyDownloadUrl: `/api/proxy-video?url=${encodedUrl}&platform=${encodedPlatform}&download=1&filename=${encodedFilename}`,
    proxyCoverUrl: info.cover
      ? `/api/proxy-image?url=${encodeURIComponent(info.cover)}&platform=${encodedPlatform}`
      : ''
  };
}

/**
 * Parses any Douyin / TikTok / Bilibili / Xiaohongshu / Kuaishou / MP4 link without watermark
 * Powered by Evil0ctal/Douyin_TikTok_Download_API native signing (ABogus + websign + WBI)
 */
export async function parseVideoLink(shareText: string): Promise<ParsedVideoInfo> {
  const pythonCmd = getPythonCommand();
  const parserPath = getParserScriptPath();

  try {
    const { stdout } = await execFileAsync(
      pythonCmd,
      [parserPath, '--mode', 'parse', '--text', shareText],
      { timeout: 45000, maxBuffer: 10 * 1024 * 1024 }
    );
    const lines = stdout.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const parsed = JSON.parse(lastLine);
    if (!parsed.success || !parsed.data) {
      throw new Error(parsed.error || '解析无水印视频失败');
    }
    return attachProxyUrls(parsed.data as ParsedVideoInfo);
  } catch (err: any) {
    if (err.stdout) {
      try {
        const lines = String(err.stdout).trim().split('\n');
        const parsed = JSON.parse(lines[lines.length - 1]);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
      } catch (innerErr: any) {
        if (innerErr.message && !innerErr.message.includes('Unexpected token')) {
          throw innerErr;
        }
      }
    }
    throw new Error(err.message || '视频链接解析服务执行异常');
  }
}

let cachedTrending: { timestamp: number; items: ParsedVideoInfo[] } | null = null;

/**
 * Fetches real live Douyin videos so users can test Douyin watermark removal with 1 click
 */
export async function fetchTrendingDouyinVideos(count = 6, forceRefresh = false): Promise<ParsedVideoInfo[]> {
  if (!forceRefresh && cachedTrending && Date.now() - cachedTrending.timestamp < 5 * 60 * 1000 && cachedTrending.items.length > 0) {
    return cachedTrending.items;
  }

  const pythonCmd = getPythonCommand();
  const parserPath = getParserScriptPath();

  const { stdout } = await execFileAsync(
    pythonCmd,
    [parserPath, '--mode', 'trending', '--count', String(count)],
    { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
  );
  const lines = stdout.trim().split('\n');
  const lastLine = lines[lines.length - 1];
  const parsed = JSON.parse(lastLine);
  if (!parsed.success || !Array.isArray(parsed.items)) {
    throw new Error(parsed.error || '获取抖音热门测试视频失败');
  }
  const items = (parsed.items as ParsedVideoInfo[]).map(attachProxyUrls);
  cachedTrending = { timestamp: Date.now(), items };
  return items;
}

/**
 * Runs ffprobe to extract reliable video stream metadata
 */
export async function probeVideo(filePath: string): Promise<VideoMetadata> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`视频文件不存在: ${filePath}`);
  }
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -show_entries format=duration,size -of json "${filePath}"`;

  let stdout = '';
  try {
    const res = await execAsync(cmd);
    stdout = res.stdout;
  } catch (err: any) {
    throw new Error(`无法调用 ffprobe 读取视频信息: ${err.message}。请确保已安装 FFmpeg。`);
  }

  const data = JSON.parse(stdout);
  const stream = data.streams?.[0];
  const format = data.format;
  if (!stream || !stream.width || !stream.height) {
    throw new Error('无法读取视频画面流或尺寸为空');
  }

  let fps = 30.0;
  if (stream.r_frame_rate) {
    const parts = stream.r_frame_rate.split('/');
    if (parts.length === 2 && Number(parts[1]) > 0) {
      fps = Math.round((Number(parts[0]) / Number(parts[1])) * 100) / 100;
    }
  }

  const duration = format?.duration ? parseFloat(format.duration) : 0;
  const sizeBytes = format?.size ? parseInt(format.size, 10) : fs.statSync(filePath).size;

  return {
    width: stream.width,
    height: stream.height,
    fps,
    duration,
    sizeBytes,
    codec: stream.codec_name || 'unknown'
  };
}

/**
 * Create a new Job for local video upload
 */
export async function createUploadJob(
  file: Express.Multer.File,
  options: { inputSize?: number; keepAudio?: boolean; maxFrames?: number } = {}
): Promise<DepthJob> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const jobDir = path.join(JOBS_STORAGE_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const ext = path.extname(file.originalname) || '.mp4';
  const sourcePath = path.join(jobDir, `source${ext}`);
  const outputPath = path.join(jobDir, `depth_output.mp4`);

  fs.copyFileSync(file.path, sourcePath);

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch {
    // ignore
  }

  const metadata = await probeVideo(sourcePath);
  const rawFrames = Math.round((metadata.duration || 1) * metadata.fps);
  const totalFrames = options.maxFrames && options.maxFrames > 0 ? Math.min(rawFrames, options.maxFrames) : rawFrames;

  const job: DepthJob = {
    id: jobId,
    sourceType: 'upload',
    sourceName: file.originalname,
    sourcePath,
    outputPath,
    status: 'queued',
    stageText: '已加入深度视频处理队列',
    progress: 0,
    currentFrame: 0,
    totalFrames,
    createdAt: Date.now(),
    inputSize: options.inputSize || 256,
    keepAudio: options.keepAudio || false,
    maxFrames: options.maxFrames || 0,
    metadata
  };

  jobs.set(jobId, job);
  executeJob(jobId);

  return job;
}

/**
 * Create a job directly from a server-side sample video file (for 1-click testing)
 */
export async function createSampleJob(
  sampleFilePath: string,
  options: { inputSize?: number; keepAudio?: boolean; maxFrames?: number } = {}
): Promise<DepthJob> {
  if (!fs.existsSync(sampleFilePath)) {
    throw new Error(`样例视频不存在: ${sampleFilePath}`);
  }

  const jobId = `job_sample_${Date.now()}`;
  const jobDir = path.join(JOBS_STORAGE_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const sourcePath = path.join(jobDir, 'source.mp4');
  const outputPath = path.join(jobDir, 'depth_output.mp4');

  fs.copyFileSync(sampleFilePath, sourcePath);

  const metadata = await probeVideo(sourcePath);

  const job: DepthJob = {
    id: jobId,
    sourceType: 'sample',
    sourceName: '样例测试视频 (320x240)',
    sourcePath,
    outputPath,
    status: 'queued',
    stageText: '样例视频已就绪，正在准备深度估计...',
    progress: 5,
    currentFrame: 0,
    totalFrames: Math.round((metadata.duration || 1) * metadata.fps),
    createdAt: Date.now(),
    inputSize: options.inputSize || 256,
    keepAudio: options.keepAudio || false,
    maxFrames: options.maxFrames || 0,
    metadata
  };

  jobs.set(jobId, job);
  executeJob(jobId);

  return job;
}

/**
 * Parses Douyin / multi-platform link using Evil0ctal/Douyin_TikTok_Download_API native signing,
 * downloads the watermark-free MP4 to jobDir, and runs Depth Anything V2 conversion.
 */
export async function createDouyinJob(
  shareText: string,
  options: { inputSize?: number; keepAudio?: boolean; maxFrames?: number } = {}
): Promise<DepthJob> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const jobDir = path.join(JOBS_STORAGE_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const sourcePath = path.join(jobDir, 'source.mp4');
  const outputPath = path.join(jobDir, 'depth_output.mp4');

  const job: DepthJob = {
    id: jobId,
    sourceType: 'douyin',
    sourceName: '无水印解析视频',
    sourcePath,
    outputPath,
    status: 'parsing',
    stageText: '正在通过 Evil0ctal 签名引擎解析抖音/全网无水印视频流...',
    progress: 8,
    currentFrame: 0,
    totalFrames: 0,
    createdAt: Date.now(),
    inputSize: options.inputSize || 256,
    keepAudio: options.keepAudio || false,
    maxFrames: options.maxFrames ?? 60
  };

  jobs.set(jobId, job);

  (async () => {
    try {
      const pythonCmd = getPythonCommand();
      const parserPath = getParserScriptPath();

      job.status = 'downloading';
      job.stageText = '正在解析 ABogus/WBI 签名并下载无水印原画 MP4...';
      job.progress = 15;

      const { stdout } = await execFileAsync(
        pythonCmd,
        [parserPath, '--mode', 'download', '--text', shareText, '--output', sourcePath],
        { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      );

      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const result = JSON.parse(lastLine);

      if (!result.success || !result.data) {
        throw new Error(result.error || '无水印视频解析下载失败');
      }

      const parsedInfo = attachProxyUrls(result.data as ParsedVideoInfo);
      job.parsedInfo = parsedInfo;
      job.sourceName = parsedInfo.title || `${parsedInfo.platformName}_${parsedInfo.videoId}`;
      job.sourceUrl = parsedInfo.videoUrl;

      const metadata = await probeVideo(sourcePath);
      job.metadata = metadata;
      const rawFrames = Math.round((metadata.duration || 1) * metadata.fps);
      job.totalFrames = job.maxFrames && job.maxFrames > 0 ? Math.min(rawFrames, job.maxFrames) : rawFrames;

      job.status = 'queued';
      job.stageText = '无水印视频下载完成，正在启动 Depth Anything V2 灰度深度估计...';
      job.progress = 25;

      executeJob(jobId);
    } catch (err: any) {
      let errMsg = err.message || '无水印视频解析失败';
      if (err.stdout) {
        try {
          const lines = String(err.stdout).trim().split('\n');
          const parsed = JSON.parse(lines[lines.length - 1]);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          // ignore
        }
      }
      job.status = 'failed';
      job.error = errMsg;
      job.stageText = `解析失败: ${job.error}`;
    }
  })();

  return job;
}

/**
 * Executes the Python Depth Anything V2 script on the job's video
 */
async function executeJob(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  const scriptPath = getScriptPath();
  if (!fs.existsSync(scriptPath)) {
    job.status = 'failed';
    job.error = `深度估计算法脚本未找到: ${scriptPath}`;
    job.stageText = `处理失败: ${job.error}`;
    return;
  }

  job.status = 'model_loading';
  job.stageText = '正在加载 Depth Anything V2 Small 深度估计模型...';
  job.progress = Math.max(job.progress, 28);

  const pythonCmd = getPythonCommand();

  const args = [
    scriptPath,
    '--input',
    job.sourcePath,
    '--output',
    job.outputPath,
    '--overwrite',
    '--input-size',
    String(job.inputSize || 256)
  ];

  if (job.maxFrames && job.maxFrames > 0) {
    args.push('--limit', String(job.maxFrames));
  }

  // If source video is 4K (>1080p) on CPU, cap output canvas to 1080p equivalent aspect ratio for fast encoding
  if (job.metadata && Math.max(job.metadata.width, job.metadata.height) > 1280) {
    const scale = 720 / Math.max(job.metadata.width, job.metadata.height);
    const outW = Math.max(2, Math.round((job.metadata.width * scale) / 2) * 2);
    const outH = Math.max(2, Math.round((job.metadata.height * scale) / 2) * 2);
    args.push('--width', String(outW), '--height', String(outH));
  }

  if (job.keepAudio) {
    args.push('--keep-audio');
  }

  const child = spawn(pythonCmd, args);

  let stderrLog = '';

  child.stdout.on('data', (data) => {
    const text = data.toString();

    const bootstrapMatch = text.match(/PROGRESS:bootstrap:([^\r\n]+)/);
    if (bootstrapMatch) {
      job.status = 'model_loading';
      job.stageText = bootstrapMatch[1].trim();
      job.progress = 26;
    }

    const inferMatch = text.match(/PROGRESS:infer:(\d+):(\d+)/);
    if (inferMatch) {
      const cur = parseInt(inferMatch[1], 10);
      const total = parseInt(inferMatch[2], 10);
      job.status = 'depth_estimation';
      job.currentFrame = cur;
      job.totalFrames = total;
      job.progress = 30 + Math.round((cur / Math.max(1, total)) * 55);
      job.stageText = `正在进行逐帧深度估计: ${cur}/${total} 帧 (${job.progress}%)`;
    }

    const encodeMatch = text.match(/PROGRESS:encode:(\d+):(\d+)/);
    if (encodeMatch) {
      const cur = parseInt(encodeMatch[1], 10);
      const total = parseInt(encodeMatch[2], 10);
      job.status = 'encoding';
      job.currentFrame = cur;
      job.progress = 85 + Math.round((cur / Math.max(1, total)) * 13);
      job.stageText = `正在进行 FFmpeg 统一归一化 H.264 灰度编码: ${cur}/${total} 帧 (${job.progress}%)`;
    }
  });

  child.stderr.on('data', (data) => {
    stderrLog += data.toString();
  });

  child.on('close', async (code) => {
    if (code === 0 && fs.existsSync(job.outputPath)) {
      try {
        const outMeta = await probeVideo(job.outputPath);
        job.outputMetadata = outMeta;
        job.status = 'completed';
        job.progress = 100;
        job.stageText = '灰度深度视频生成成功！已验证近亮远暗与 H.264 编码';
        job.completedAt = Date.now();
      } catch (probeErr: any) {
        job.status = 'failed';
        job.error = `生成文件校验失败: ${probeErr.message}`;
        job.stageText = `处理失败: ${job.error}`;
      }
    } else {
      job.status = 'failed';
      job.error = stderrLog.trim() || `深度估计进程异常退出 (code ${code})`;
      job.stageText = `处理失败: ${job.error}`;
    }
  });

  child.on('error', (err) => {
    job.status = 'failed';
    job.error = err.message;
    job.stageText = `启动深度估计失败: ${err.message}`;
  });
}

/**
 * Warms up the Python depth environment on server startup so cold container restarts self-heal immediately
 */
export function warmUpDepthEnvironment(): void {
  const pythonCmd = getPythonCommand();
  const scriptPath = getScriptPath();
  if (!fs.existsSync(scriptPath)) return;

  const child = spawn(pythonCmd, [scriptPath, '--help'], { stdio: 'ignore' });
  child.on('error', () => {});
}

