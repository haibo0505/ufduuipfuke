import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Download,
  Terminal,
  Smartphone,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  Code2,
  Sparkles
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WechatTutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'cheatsheet' | 'faq'>('guide');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
              微
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                微信小程序新手极速上手 & 运行指南
              </h3>
              <p className="text-xs text-slate-500">
                从 0 到 1 导入「微信开发者工具」真机调试与上线流程
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🚀 5步导入微信开发者工具
          </button>
          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition ${
              activeTab === 'cheatsheet'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📖 微信核心语法 & API 速查
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 transition ${
              activeTab === 'faq'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            💡 常见疑问解答 (FAQ)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-700 text-xs space-y-4">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm mb-1">无需任何复杂配置，开箱即用！</div>
                  <p className="text-xs leading-relaxed opacity-90">
                    本工坊生成的全部代码已严格遵循微信官方标准目录结构（含 project.config.json 与
                    app.json），解压后可直接在官方开发者工具中打开并真机扫码调试。
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-xs">
                    第一步：点击本平台右上角「下载完整工程源码 (ZIP)」
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    下载后的压缩包内包含标准目录：app.json、app.wxss、app.js 以及所有 pages
                    功能页面。将该压缩包解压到电脑的任意本地文件夹中。
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-xs">
                    第二步：下载并安装官方「微信开发者工具」
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    前往微信开放社区下载官方客户端（Windows / Mac）：
                  </p>
                  <a
                    href="https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline"
                  >
                    微信开发者工具官方下载页面 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-xs">
                    第三步：微信扫码登录工具，点击「+」导入项目
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    - <strong>项目名称</strong>：随意填写（例如：麦香轻食点餐）
                    <br />- <strong>目录</strong>：选择刚才解压的文件夹根目录
                    <br />- <strong>AppID</strong>：如果有自己的小程序
                    AppID，直接填入；若暂未申请，直接选择
                    <span className="text-emerald-700 font-bold">「测试号」</span>
                    即可免账号秒体验！
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-xs">第四步：模拟器预览与热重载调试</div>
                  <p className="text-slate-600 text-[11px]">
                    导入后即可在开发者工具左侧看到完整的手机模拟界面，修改代码实时刷新，控制台（Console）可查看完整的微信日志和报错。
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  5
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 text-xs">
                    第五步：点击工具栏「真机预览」或「上传」
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    点击「预览」生成专属二维码，使用自己的微信扫码，即可在真实 iPhone / Android
                    手机微信中运行体验！测试满意后，点击「上传」提交至微信公众平台审核发布。
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cheatsheet' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 text-xs">
                  微信 WXML 组件与传统 HTML 对比
                </div>
                <div className="divide-y divide-slate-100 font-mono text-[11px]">
                  <div className="p-3 grid grid-cols-2">
                    <div>
                      <code>&lt;view&gt;...&lt;/view&gt;</code>
                    </div>
                    <div className="text-slate-500">等同于 &lt;div&gt; 块级容器容器组件</div>
                  </div>
                  <div className="p-3 grid grid-cols-2 bg-slate-50/50">
                    <div>
                      <code>&lt;text&gt;...&lt;/text&gt;</code>
                    </div>
                    <div className="text-slate-500">等同于 &lt;span&gt; 行内文本（支持长按复制）</div>
                  </div>
                  <div className="p-3 grid grid-cols-2">
                    <div>
                      <code>&lt;image src="..." /&gt;</code>
                    </div>
                    <div className="text-slate-500">等同于 &lt;img&gt;（默认自带懒加载与裁剪模式）</div>
                  </div>
                  <div className="p-3 grid grid-cols-2 bg-slate-50/50">
                    <div>
                      <code>&lt;swiper&gt; &lt;swiper-item&gt;</code>
                    </div>
                    <div className="text-slate-500">微信原生高性能轮播滑块容器</div>
                  </div>
                  <div className="p-3 grid grid-cols-2">
                    <div>
                      <code>&lt;button open-type="share"&gt;</code>
                    </div>
                    <div className="text-slate-500">直接唤起微信原生转发好友面板</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 text-xs">
                  微信小程序核心专属尺寸单位：rpx
                </div>
                <div className="p-3 text-[11px] text-slate-600 leading-relaxed">
                  微信规定<strong>全屏宽度恒等于 750rpx</strong>。以 iPhone 6 (375px 屏幕) 为例，
                  <code>1rpx = 0.5px</code>。开发者只需按 750px 设计稿 1:1 标注尺寸，在任何大小的手机上都会自动等比自适应！
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 text-xs">
                  高频常用微信 API 速查
                </div>
                <div className="divide-y divide-slate-100 font-mono text-[11px]">
                  <div className="p-2.5">
                    <code>wx.showToast({`{ title: '成功', icon: 'success' }`})</code>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-sans">
                      轻量浮层提示
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50/50">
                    <code>wx.request({`{ url: 'https://...', success: ... }`})</code>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-sans">
                      发起 HTTPS 网络数据请求
                    </div>
                  </div>
                  <div className="p-2.5">
                    <code>wx.setStorageSync('key', value) / getStorageSync('key')</code>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-sans">
                      微信本地持久化缓存（最高 10MB）
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50/50">
                    <code>wx.navigateTo({`{ url: '/pages/detail/detail?id=1' }`})</code>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-sans">
                      页面保留跳转（顶部带返回箭头）
                    </div>
                  </div>
                  <div className="p-2.5">
                    <code>wx.login({`{ success(res) { res.code } }`})</code>
                    <div className="text-slate-500 text-[10px] mt-0.5 font-sans">
                      静默获取用户微信身份凭证 code
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  Q: 个人开发者可以做并上线微信小程序吗？
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  可以！个人身份完全可以注册微信小程序账号。工具类、习惯打卡、个人名片、记账日历、生活助手等均对个人开放；而餐饮外卖、支付收款、在线商城等需个体工商户或企业主体资格。
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  Q: 如果我还没有微信小程序 AppID，能运行吗？
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  完全可以！在微信开发者工具导入时，直接选择「测试号」，即可拥有全部编译、运行、模拟器调试功能，甚至支持局域网真机扫码预览！
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="font-bold text-slate-900 text-xs mb-1">
                  Q: 我能用这个代码转成 Uni-app 或 Taro 跨端开发吗？
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  当然可以。本系统生成的结构是微信官方原生最纯粹的架构（WXML+WXSS+JS），也是 Uni-app / Taro 底层最终编译的标准目标代码，理解与二开非常直观容易。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            我明白了，去开发
          </button>
        </div>
      </div>
    </div>
  );
};
