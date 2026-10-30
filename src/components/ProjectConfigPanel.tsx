import React from 'react';
import {
  Settings2,
  Palette,
  Hash,
  Layers,
  Sparkles,
  Layout,
  Sliders,
  CheckCircle2,
  FileCode2,
  Smartphone
} from 'lucide-react';
import { MiniProgramMeta, MiniProgramTemplate } from '../types/miniprogram';

interface ConfigPanelProps {
  template: MiniProgramTemplate;
  meta: MiniProgramMeta;
  onMetaChange: (updated: MiniProgramMeta) => void;
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onOpenTutorial: () => void;
}

const PRESET_COLORS = [
  { name: '微信经典绿', color: '#07C160' },
  { name: '活力暖阳橙', color: '#EA580C' },
  { name: '商务科技蓝', color: '#1E40AF' },
  { name: '高端雅致紫', color: '#7C3AED' },
  { name: '浪漫珊瑚红', color: '#E11D48' },
  { name: '极简曜石黑', color: '#18181B' }
];

export const ProjectConfigPanel: React.FC<ConfigPanelProps> = ({
  template,
  meta,
  onMetaChange,
  activePageId,
  onSelectPage,
  onOpenTutorial
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-5 text-xs text-slate-700">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-xs">小程序工程参数与页面配置</h3>
        </div>
        <button
          onClick={onOpenTutorial}
          className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-1"
        >
          新手5步指南 ›
        </button>
      </div>

      {/* App Basic Info */}
      <div className="space-y-3">
        <div>
          <label className="block text-slate-500 font-medium mb-1 text-[11px]">小程序名称 (appName)</label>
          <input
            type="text"
            value={meta.appName}
            onChange={(e) => onMetaChange({ ...meta, appName: e.target.value })}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-xs font-semibold text-slate-800"
            placeholder="例如：麦香轻食点餐"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-500 font-medium mb-1 text-[11px]">
              微信 AppID (或测试号)
            </label>
            <input
              type="text"
              value={meta.appId}
              onChange={(e) => onMetaChange({ ...meta, appId: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="touristappid"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1 text-[11px]">版本号 (version)</label>
            <input
              type="text"
              value={meta.version}
              onChange={(e) => onMetaChange({ ...meta, version: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="1.0.0"
            />
          </div>
        </div>

        {/* Unified Backend API_BASE_URL Configuration */}
        <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-indigo-950 font-bold text-[11px]">
              后端 API 服务地址 (写入 utils/config.js)
            </label>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
              API_BASE_URL
            </span>
          </div>
          <input
            type="text"
            value={meta.apiBaseUrl ?? 'https://YOUR_API_DOMAIN'}
            onChange={(e) => onMetaChange({ ...meta, apiBaseUrl: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            placeholder="https://YOUR_API_DOMAIN 或 http://192.168.1.x:3000"
          />
          <p className="text-[10px] text-indigo-800/90 leading-relaxed">
            导出小程序源码时自动写入 <code className="font-mono font-bold">utils/config.js</code>。不能填 AI Studio 的 localhost；请填写你部署后的公网 HTTPS 域名或电脑局域网 IP。
          </p>
        </div>
      </div>

      {/* Theme Color Picker */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span>小程序全局主题色 (themeColor)</span>
          </label>
          <span className="font-mono text-[10px] text-slate-400">{meta.themeColor}</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {PRESET_COLORS.map((item) => (
            <button
              key={item.color}
              onClick={() => onMetaChange({ ...meta, themeColor: item.color })}
              className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                meta.themeColor === item.color
                  ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: item.color }}
              title={item.name}
            />
          ))}
          <input
            type="color"
            value={meta.themeColor}
            onChange={(e) => onMetaChange({ ...meta, themeColor: e.target.value })}
            className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent p-0"
            title="自定义色盘"
          />
        </div>
      </div>

      {/* Page Navigation Switcher */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
          <Layout className="w-3.5 h-3.5 text-slate-400" />
          <span>小程序页面路由列表 ({template.pages.length} 个页面)</span>
        </label>

        <div className="space-y-1.5">
          {template.pages.map((p) => {
            const isSelected = p.id === activePageId;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPage(p.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                  isSelected
                    ? 'bg-emerald-50/80 border border-emerald-300 text-emerald-950 font-semibold shadow-sm'
                    : 'bg-slate-50/80 hover:bg-slate-100 border border-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? meta.themeColor : '#cbd5e1' }}
                  />
                  <span className="text-xs">{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({p.id})</span>
                </div>
                <span className="text-[10px] text-slate-400">{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini Program Features Badge */}
      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-[11px] text-slate-600">
        <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          已就绪微信基础库规范：
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
          <div>✓ WXML 标签规范</div>
          <div>✓ WXSS rpx 自适应</div>
          <div>✓ TabBar 底部栏</div>
          <div>✓ wx.showToast 弹窗</div>
          <div>✓ 胶囊菜单交互</div>
          <div>✓ 微信分享机制</div>
        </div>
      </div>
    </div>
  );
};
