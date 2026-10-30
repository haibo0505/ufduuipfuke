import JSZip from 'jszip';
import { MiniProgramFile, MiniProgramMeta } from '../types/miniprogram';

export async function exportMiniProgramAsZip(
  files: MiniProgramFile[],
  meta: MiniProgramMeta
): Promise<Blob> {
  const zip = new JSZip();

  // Add README.md guide directly at the ZIP root
  const readmeContent = `# ${meta.appName} - 微信小程序项目源码

本项目由 Google AI Studio · 微信小程序开发工坊一键生成。

## 快速使用指引（只需 3 步）：

1. **下载安装「微信开发者工具」**
   官方下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

2. **导入项目（重要：已采用平铺根目录结构，解压后直接选该文件夹即可）**
   - 将下载的 ZIP 压缩包解压到一个新建文件夹中
   - 打开微信开发者工具，点击 **「+」导入项目**
   - **目录**：直接选择解压后的文件夹（该目录下第一层直接包含 \`app.json\`、\`app.js\`、\`project.config.json\` 和 \`pages/\`）
   - **AppID**：填入你的微信小程序 AppID；若暂无 AppID，请点击选择 **「测试号」** 或填入 \`${meta.appId || 'touristappid'}\`
   - **开发语言**：JavaScript / WXML

3. **预览与真机调试**
   - 点击上方工具栏 **「编译」** 即可在模拟器实时预览。
   - 在右上角 **「详情 -> 本地设置」** 中勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**。

## 根目录结构说明：
- \`app.json\`: 小程序全局页面路由、窗口与底部 TabBar 配置（位于根目录）
- \`app.js\`: 小程序生命周期与全局状态（位于根目录）
- \`app.wxss\`: 全局通用样式与响应式变量（位于根目录）
- \`project.config.json\`: 微信开发者工具工程主配置（\`miniprogramRoot: "."\`）
- \`project.private.config.json\`: 本地私有配置（不覆盖 \`miniprogramRoot\`）
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
