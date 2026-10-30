# 幻深 · 抖音去水印 & 灰度深度视频后端部署与小程序配置指南

## 一、为什么微信开发者工具不能直接请求 `localhost:3000`？

- 在微信开发者工具中，`localhost:3000` 指向的是**你本地电脑自己的 3000 端口**，而不是 Google AI Studio 云端容器内的 3000 端口。
- 此外，Google AI Studio 的临时预览地址受浏览器登录 Cookie 保护，不能作为微信小程序的长期公网生产 API 地址。
- 因此，生成的微信小程序源码已统一通过 `utils/config.js` 管理 `API_BASE_URL`。你需要按下方任一方式启动后端并填入对应地址。

---

## 二、方案 A：本地电脑或局域网运行后端（最快本地联调）

如果你希望在自己的电脑上直接运行后端供微信开发者工具连接：

### 1. 环境准备
确保电脑已安装：
- **Node.js** >= 18
- **Python** >= 3.10
- **FFmpeg**（命令行可执行 `ffmpeg -version` 和 `ffprobe -version`）

### 2. 安装依赖并启动后端
```bash
# 1. 安装 Python 依赖 (去水印签名 + Depth Anything V2 + OpenCV)
pip install -r backend/requirements.txt

# 2. 安装 Node.js 依赖
npm install

# 3. 启动后端服务 (默认监听 http://0.0.0.0:3000)
npm run dev
```

### 3. 验证后端健康状态
浏览器访问或执行：
```bash
curl http://127.0.0.1:3000/api/health
```
返回如下 JSON 即表示成功启动：
```json
{
  "success": true,
  "service": "depth-video-backend",
  "status": "running"
}
```

### 4. 修改小程序 `utils/config.js`
打开导出的微信小程序项目中的 `utils/config.js`：
- 若微信开发者工具与后端运行在**同一台电脑**：
  ```javascript
  const API_BASE_URL = 'http://127.0.0.1:3000';
  ```
- 若需要在**同一 Wi-Fi 下的手机真机预览**：将地址改为你电脑的局域网 IP（通过 `ipconfig` / `ifconfig` 查看）：
  ```javascript
  const API_BASE_URL = 'http://192.168.1.100:3000';
  ```
- 在微信开发者工具右上角 **「详情 -> 本地设置」** 中勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**。

---

## 三、方案 B：公网云服务器 / 容器平台部署（推荐正式使用）

本项目根目录已提供完整的生产级 `Dockerfile`（内置 Node.js 20 + Python 3 + FFmpeg + PyTorch CPU + OpenCV，并自动预置 `Depth-Anything-V2-Small` 权重）。

### 1. 使用 Docker 一键构建与运行（阿里云 / 腾讯云 / 任意 Linux 云服务器）
```bash
# 构建镜像
docker build -t depth-video-backend .

# 启动容器（映射 3000 端口，并挂载模型缓存卷）
docker run -d \
  --name depth-video-backend \
  --restart always \
  -p 3000:3000 \
  -v depth_model_cache:/app/backend/.model_cache \
  depth-video-backend
```

### 2. 使用 Google Cloud Run / Railway / Render 部署
- 将本项目推送到你的 GitHub 仓库。
- 在 **Google Cloud Run** / **Railway** / **Render** 中选择 **Deploy from Dockerfile**。
- 平台会自动提供带 HTTPS 证书的公网域名（例如 `https://depth-video-backend-xxxx.run.app`）。
- 访问 `https://你的公网域名/api/health` 确认返回 `"status": "running"`。

---

## 四、微信小程序域名配置规范

1. **写入 `utils/config.js`**
   - 你可以在导出小程序 ZIP 前，直接在页面顶部的 **「小程序后端 API_BASE_URL」** 输入框中填入你的 `https://你的公网域名`，导出的 `utils/config.js` 会自动写入该地址。
   - 也可以在导出后直接编辑小程序根目录下的 `utils/config.js`：
     ```javascript
     const API_BASE_URL = 'https://你的公网域名';
     ```

2. **配置微信公众平台合法域名（正式版/体验版必配）**
   登录 [微信公众平台 (mp.weixin.qq.com)](https://mp.weixin.qq.com) -> **开发 -> 开发管理 -> 开发设置 -> 服务器域名**，将你的 HTTPS 域名同时添加到以下三项：
   - **request 合法域名**：`https://你的公网域名`
   - **uploadFile 合法域名**：`https://你的公网域名`
   - **downloadFile 合法域名**：`https://你的公网域名`
