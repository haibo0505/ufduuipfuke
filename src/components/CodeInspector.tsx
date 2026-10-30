import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Folder,
  ChevronDown,
  ChevronRight,
  Code2,
  FileJson,
  Palette,
  Layers,
  Sparkles
} from 'lucide-react';
import { MiniProgramFile } from '../types/miniprogram';

interface CodeInspectorProps {
  files: MiniProgramFile[];
  selectedPath: string;
  onSelectPath: (path: string) => void;
  onShowToast: (msg: string) => void;
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({
  files,
  selectedPath,
  onSelectPath,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [openFolders, setOpenFolders] = useState<{ [folder: string]: boolean }>({
    '': true,
    pages: true,
    'pages/index': true,
    'pages/menu': true,
    'pages/services': true,
    'pages/card': true,
    'pages/stats': true
  });

  const currentFile = files.find((f) => f.path === selectedPath) || files[0];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    onShowToast(`已复制 ${currentFile.name} 源码`);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'json':
        return <FileJson className="w-3.5 h-3.5 text-amber-500" />;
      case 'wxml':
        return <Code2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'wxss':
        return <Palette className="w-3.5 h-3.5 text-sky-500" />;
      case 'js':
        return <FileCode className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-200">
      {/* Code Inspector Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs text-slate-100">微信小程序工程源码查看器</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {files.length} 个文件
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-xs font-medium transition shadow-sm"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? '已复制代码' : '复制当前文件'}</span>
        </button>
      </div>

      {/* Main Split Layout: File Tree & Code Viewer */}
      <div className="flex flex-1 min-h-[460px] overflow-hidden">
        {/* Left File Tree Sidebar */}
        <div className="w-56 bg-slate-950/50 border-r border-slate-800 overflow-y-auto p-2 text-xs">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            项目工程目录
          </div>

          <div className="space-y-0.5 mt-1">
            {files.map((file) => {
              const isSelected = file.path === selectedPath;
              return (
                <button
                  key={file.path}
                  onClick={() => onSelectPath(file.path)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {getFileIcon(file.type)}
                  <span className="truncate flex-1 font-mono text-[11px]">{file.path}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Display Area */}
        <div className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden">
          {/* File Tab & Description Bar */}
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400 font-semibold">{currentFile.path}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {currentFile.type}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[360px]">
              {currentFile.description}
            </div>
          </div>

          {/* Syntax Code Container */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-emerald-500/30 selection:text-emerald-200">
            <pre className="text-slate-300">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
