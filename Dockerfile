# ==============================================================================
# Dockerfile - 幻深 · 抖音去水印 & 灰度深度视频转换后端 (Node.js 20 + Python 3 + FFmpeg + PyTorch CPU)
# 适用平台：Docker / Google Cloud Run / Railway / Render / 阿里云 / 腾讯云容器服务
# ==============================================================================
FROM node:20-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    PYTHONUNBUFFERED=1 \
    DEPTH_CACHE_DIR=/app/backend/.model_cache

# 1. 安装 Python3、FFmpeg (含 libx264 与 ffprobe) 及 OpenCV 运行库
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    git \
    ca-certificates \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. 安装 Python 依赖 (PyTorch CPU + OpenCV + HuggingFace Hub + 抖音签名依赖)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip3 install --break-system-packages --no-cache-dir -r ./backend/requirements.txt

# 3. 预下载 Depth Anything V2 Small 权重文件，避免容器冷启动重新下载
RUN mkdir -p /app/backend/.model_cache/checkpoints && \
    python3 -c "from huggingface_hub import hf_hub_download; import shutil; p = hf_hub_download(repo_id='depth-anything/Depth-Anything-V2-Small', filename='depth_anything_v2_vits.pth'); shutil.copyfile(p, '/app/backend/.model_cache/checkpoints/depth_anything_v2_vits.pth')"

# 4. 安装 Node.js 依赖并构建前端生产资源
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# 5. 启动全栈服务 (监听 0.0.0.0:3000)
CMD ["npm", "start"]
