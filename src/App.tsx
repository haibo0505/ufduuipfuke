/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  BookOpen,
  Code2,
  Smartphone,
  Sparkles,
  Layers,
  HelpCircle,
  Copy,
  Check,
  CheckCircle,
  ExternalLink,
  Laptop,
  Github,
  Scissors,
  Video,
  Eye
} from 'lucide-react';
import { TEMPLATES } from './services/templates';
import { generateMiniProgramFiles } from './services/codeGenerator';
import { exportMiniProgramAsZip, triggerDownload } from './services/zipExport';
import { MiniProgramMeta, TemplateId } from './types/miniprogram';
import { WechatPhoneSimulator } from './components/WechatPhoneSimulator';
import { CodeInspector } from './components/CodeInspector';
import { ProjectConfigPanel } from './components/ProjectConfigPanel';
import { WechatTutorialModal } from './components/WechatTutorialModal';
import { DouyinDepthWorkspace } from './components/DouyinDepthWorkspace';
import { TechStackGuideModal } from './components/TechStackGuideModal';

export default function App() {
  // Default to the user's requested depth video project!
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('depth_video');
  const [activePageId, setActivePageId] = useState<string>('index');
  const [activeMainView, setActiveMainView] = useState<'workspace' | 'miniprogram'>('workspace');
  const [activeTabMode, setActiveTabMode] = useState<'split' | 'simulator' | 'code'>('split');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isTechGuideOpen, setIsTechGuideOpen] = useState<boolean>(false);

  // Active template
  const currentTemplate = useMemo(() => {
    return TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  }, [selectedTemplateId]);

  // Project meta
  const [meta, setMeta] = useState<MiniProgramMeta>({
    appName: currentTemplate.name,
    appId: currentTemplate.defaultAppId,
    version: '1.0.0',
    themeColor: currentTemplate.themeColor,
    themeBg: '#F7F8FA',
    author: 'AI Studio',
    description: currentTemplate.description,
    apiBaseUrl: 'https://YOUR_API_DOMAIN'
  });

  // Switch template handler
  const handleSelectTemplate = (id: TemplateId) => {
    const nextTemplate = TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
    setSelectedTemplateId(id);
    setActivePageId(nextTemplate.pages[0].id);
    setMeta((prev) => ({
      appName: nextTemplate.name,
      appId: nextTemplate.defaultAppId,
      version: '1.0.0',
      themeColor: nextTemplate.themeColor,
      themeBg: '#F7F8FA',
      author: 'AI Studio',
      description: nextTemplate.description,
      apiBaseUrl: prev.apiBaseUrl || 'https://YOUR_API_DOMAIN'
    }));
    showToast(`已切换至模版：${nextTemplate.name}`);
  };

  // Generate all WeChat files in memory
  const generatedFiles = useMemo(() => {
    return generateMiniProgramFiles(currentTemplate, meta);
  }, [currentTemplate, meta]);

  // Selected file path in Code Inspector
  const [selectedFilePath, setSelectedFilePath] = useState<string>('pages/index/index.wxml');

  // Trigger toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 2500);
  };

  // Download project as ZIP
  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      showToast('正在生成标准微信小程序源码压缩包 (含抖音去水印与深度转换)...');
      const blob = await exportMiniProgramAsZip(generatedFiles, meta);
      const safeName = (meta.appName || 'depth-video-miniprogram').replace(/[\\/:*?"<>|]+/g, '-');
      const filename = `${safeName}.zip`;
      triggerDownload(blob, filename);
      showToast('🎉 下载成功！可直接在微信开发者工具中导入');
    } catch (err) {
      console.error(err);
      showToast('打包失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  // Match code inspector file when active page changes
  const handlePageChange = (pageId: string) => {
    setActivePageId(pageId);
    const matched = currentTemplate.pages.find((p) => p.id === pageId);
    if (matched) {
      setSelectedFilePath(`${matched.path}.wxml`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md transition-colors"
              style={{ backgroundColor: meta.themeColor }}
            >
              DEPTH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base leading-tight">
                  幻深 · 抖音/视频转灰度深度视频
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  真实 Python 算法 · Depth Anything V2
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                严格依据 depth-video-skill 算法 · 输出 H.264 灰度 MP4 (近亮远暗) · 微信小程序套件
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setIsTechGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <Github className="w-4 h-4 text-slate-800" />
              <span>技术架构 & 原理说明</span>
            </button>

            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>5步导入微信工具</span>
            </button>

            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition disabled:opacity-50"
              style={{ backgroundColor: meta.themeColor }}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? '打包中...' : '下载小程序源码 (ZIP)'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Interactive Studio vs WeChat Mini Program Simulator & Code */}
        <div className="bg-slate-50/95 border-t border-slate-200/80 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMainView('workspace')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeMainView === 'workspace'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>① 在线视频去水印 & 灰度深度转换工作台</span>
              </button>

              <button
                onClick={() => setActiveMainView('miniprogram')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeMainView === 'miniprogram'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>② 微信小程序真机模拟器 & 工程源码查看</span>
              </button>
            </div>

            {/* Template Selector dropdown when in Mini Program view */}
            {activeMainView === 'miniprogram' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">切换小程序模板:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value as TemplateId)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Solution summary banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                已部署开源去水印引擎 Evil0ctal/Douyin_TikTok_Download_API + Depth Anything V2
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">
              复制抖音/全网视频链接一键去水印下载原画 MP4，或上传视频转为 Seedance 灰度深度视频！
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              1. <strong>抖音/全网链接一键去水印下载</strong>：基于 GitHub 开源项目 <code>Evil0ctal/Douyin_TikTok_Download_API</code> 核心签名模块（<code>ABogus + Websign + WBI</code>）改造部署，支持抖音、TikTok、B站、小红书、快手一键提取无水印原画 MP4 并直接下载；
              <br />
              2. <strong>真实深度视频转换</strong>：复用 <code>haibo0505/depth-video-skill</code>，基于 Depth Anything V2 逐帧推导相对景深（近处亮、远处暗，输出 H.264 灰度 MP4）；
              <br />
              3. <strong>全套微信小程序源码</strong>：可一键打包导出标准工程代码，同步对接去水印接口与深度视频转换接口！
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0 bg-slate-900/60 border border-indigo-400/30 p-3 rounded-2xl">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-indigo-200">
                小程序后端 API_BASE_URL (导出写入 utils/config.js)：
              </label>
              <input
                type="text"
                value={meta.apiBaseUrl ?? 'https://YOUR_API_DOMAIN'}
                onChange={(e) => setMeta({ ...meta, apiBaseUrl: e.target.value })}
                placeholder="https://YOUR_API_DOMAIN"
                className="w-full sm:w-64 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-indigo-400/40 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              onClick={handleExportZip}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5 self-end sm:self-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载小程序工程包</span>
            </button>
          </div>
        </div>

        {/* View 1: Real-time Interactive Douyin Watermark Remover & Depth Video Converter */}
        {activeMainView === 'workspace' && (
          <DouyinDepthWorkspace
            onShowToast={showToast}
            onSelectMiniProgramPage={(pageId: string) => {
              setActiveMainView('miniprogram');
              handlePageChange(pageId);
            }}
          />
        )}

        {/* View 2: WeChat Mini Program Simulator & Code Inspector */}
        {activeMainView === 'miniprogram' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">小程序视图模式：</span>
                <button
                  onClick={() => setActiveTabMode('split')}
                  className={`px-3 py-1 rounded-lg font-medium ${
                    activeTabMode === 'split' ? 'bg-indigo-600 text-white' : 'bg-slate-100'
                  }`}
                >
                  双屏对照
                </button>
                <button
                  onClick={() => setActiveTabMode('simulator')}
                  className={`px-3 py-1 rounded-lg font-medium ${
                    activeTabMode === 'simulator' ? 'bg-indigo-600 text-white' : 'bg-slate-100'
                  }`}
                >
                  微信真机模拟
                </button>
                <button
                  onClick={() => setActiveTabMode('code')}
                  className={`px-3 py-1 rounded-lg font-medium ${
                    activeTabMode === 'code' ? 'bg-indigo-600 text-white' : 'bg-slate-100'
                  }`}
                >
                  工程代码查看器
                </button>
              </div>

              <span className="text-slate-400 text-[11px]">
                当前小程序：{currentTemplate.name} ({currentTemplate.pages.length}个页面)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Config Panel */}
              <div
                className={`${
                  activeTabMode === 'simulator'
                    ? 'lg:col-span-4'
                    : activeTabMode === 'code'
                    ? 'lg:col-span-3'
                    : 'lg:col-span-3'
                } w-full`}
              >
                <ProjectConfigPanel
                  template={currentTemplate}
                  meta={meta}
                  onMetaChange={setMeta}
                  activePageId={activePageId}
                  onSelectPage={handlePageChange}
                  onOpenTutorial={() => setIsTutorialOpen(true)}
                />
              </div>

              {/* Center Column: Phone Simulator */}
              {(activeTabMode === 'split' || activeTabMode === 'simulator') && (
                <div
                  className={`${
                    activeTabMode === 'simulator'
                      ? 'lg:col-span-8 flex justify-center'
                      : 'lg:col-span-4 flex justify-center'
                  } w-full`}
                >
                  <WechatPhoneSimulator
                    template={currentTemplate}
                    meta={meta}
                    activePageId={activePageId}
                    onPageChange={handlePageChange}
                    onShowToast={showToast}
                  />
                </div>
              )}

              {/* Right Column: Code Inspector */}
              {(activeTabMode === 'split' || activeTabMode === 'code') && (
                <div
                  className={`${
                    activeTabMode === 'code' ? 'lg:col-span-9' : 'lg:col-span-5'
                  } w-full h-[760px]`}
                >
                  <CodeInspector
                    files={generatedFiles}
                    selectedPath={selectedFilePath}
                    onSelectPath={setSelectedFilePath}
                    onShowToast={showToast}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Simulated Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Beginners 5-step tutorial modal */}
      <WechatTutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {/* GitHub Douyin projects & Depth video architecture modal */}
      <TechStackGuideModal isOpen={isTechGuideOpen} onClose={() => setIsTechGuideOpen(false)} />
    </div>
  );
}
