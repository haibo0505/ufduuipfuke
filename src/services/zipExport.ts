import JSZip from 'jszip';
import { MiniProgramFile, MiniProgramMeta } from '../types/miniprogram';

export async function exportMiniProgramAsZip(
  files: MiniProgramFile[],
  meta: MiniProgramMeta
): Promise<Blob> {
  const zip = new JSZip();

  // Add README.md guide directly at the ZIP root
  const configuredApiUrl = (meta.apiBaseUrl || 'https://YOUR_API_DOMAIN').trim().replace(/\/+$/, '');
  const readmeContent = `# ${meta.appName} - 微信小程序项目源码

本项目由 Google AI Studio · 微信小程序开发工坊一键生成。

## 一、核心步骤：配置后端 API 服务地址 (\`utils/config.js\`)

微信小程序运行在你的电脑（微信开发者工具）或手机微信客户端中，**不能使用 AI Studio 内部的 \`localhost:3000\`**。
所有网络请求（去水印 \`/api/parse\`、视频上传 \`/api/jobs/upload\`、深度视频转换 \`/api/jobs/douyin\`、进度查询 \`/api/jobs/:id\`、视频预览与下载）已统一收敛到 \`utils/config.js\`：

\`\`\`javascript
// utils/config.js
const API_BASE_URL = '${configuredApiUrl}';
\`\`\`

### 方式 1：本地/局域网开发调试（微信开发者工具）
1. 在你自己的电脑或服务器上启动本项目的 Node.js + Python 后端服务（默认监听 \`0.0.0.0:3000\`）：
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`
2. 打开小程序源码中的 \`utils/config.js\`，将 \`API_BASE_URL\` 修改为你电脑的局域网 IP（例如 \`http://192.168.1.100:3000\`）或本地端口（若后端就运行在同一台电脑上，可填 \`http://127.0.0.1:3000\`）。
3. 在微信开发者工具右上角 **「详情 -> 本地设置」** 中勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**。

### 方式 2：正式上线/真机发布（公网 HTTPS 部署）
1. 使用项目根目录提供的 \`Dockerfile\` 和 \`DEPLOY.md\`，将后端部署到支持 Python + FFmpeg + PyTorch 的云服务器或容器平台（如 Cloud Run、Railway、Render、阿里云 ECS/容器服务等），获得公网 \`https://your-api-domain.com\` 地址。
2. 将 \`utils/config.js\` 中的 \`API_BASE_URL\` 修改为你的公网 HTTPS 域名。
3. 登录 **微信公众平台 -> 开发 -> 开发管理 -> 开发设置 -> 服务器域名**，将你的 HTTPS 域名同时添加到：
   - **request 合法域名**：\`https://your-api-domain.com\`
   - **uploadFile 合法域名**：\`https://your-api-domain.com\`
   - **downloadFile 合法域名**：\`https://your-api-domain.com\`

---

## 二、快速导入微信开发者工具（平铺根目录结构）

1. 将下载的 ZIP 压缩包解压到一个新建文件夹中。
2. 打开微信开发者工具，点击 **「+」导入项目**。
3. **目录**：直接选择解压后的文件夹（第一层直接包含 \`app.json\`、\`app.js\`、\`project.config.json\`、\`utils/config.js\` 和 \`pages/\`）。
4. **AppID**：填入你的微信小程序 AppID 或选择 **「测试号」**（\`${meta.appId || 'touristappid'}\`）。

## 三、根目录结构说明
- \`utils/config.js\`: **统一后端 API 地址配置**（\`API_BASE_URL\`、\`isApiConfigured()\`、\`buildApiUrl()\`）
- \`app.json\`: 小程序全局页面路由、窗口与底部 TabBar 配置
- \`app.js\`: 小程序生命周期与全局状态
- \`app.wxss\`: 全局通用样式与响应式变量
- \`project.config.json\`: 微信开发者工具工程主配置（\`miniprogramRoot: "."\`）
- \`project.private.config.json\`: 本地私有配置（默认开启 \`urlCheck: false\`）
- \`sitemap.json\`: 微信搜索引擎收录策略
- \`pages/\`: 业务功能页面集合（\`index/\`、\`process/\`、\`player/\`、\`history/\`）
`;

  zip.file('README.md', readmeContent);

  // Add each generated file directly at the root of the ZIP (no extra wrapper folder!)
  files.forEach((file) => {
    const cleanPath = file.path.replace(/^\/+/, '');
    zip.file(cleanPath, file.content);
  });

  return await zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
