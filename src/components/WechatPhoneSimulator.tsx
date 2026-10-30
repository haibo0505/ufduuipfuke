import React, { useState } from 'react';
import {
  Smartphone,
  RotateCcw,
  Sun,
  Moon,
  Share2,
  MoreHorizontal,
  Circle,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle,
  Check,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
  ChevronRight,
  ExternalLink,
  CreditCard,
  QrCode,
  ShieldCheck,
  X
} from 'lucide-react';
import { MiniProgramTemplate, MiniProgramMeta } from '../types/miniprogram';

interface SimulatorProps {
  template: MiniProgramTemplate;
  meta: MiniProgramMeta;
  activePageId: string;
  onPageChange: (pageId: string) => void;
  onShowToast: (message: string) => void;
}

export const WechatPhoneSimulator: React.FC<SimulatorProps> = ({
  template,
  meta,
  activePageId,
  onPageChange,
  onShowToast
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deviceModel, setDeviceModel] = useState<'iphone15' | 'se'>('iphone15');
  const [showWechatMenu, setShowWechatMenu] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState<string | null>(null);

  // Dynamic template local simulator states
  const [cartItems, setCartItems] = useState<{ [id: string]: number }>({ d1: 1, d6: 1 });
  const [selectedCategory, setSelectedCategory] = useState<string>('c1');
  const [habitsData, setHabitsData] = useState(template.simulatorData.habits || []);
  const [selectedBookingTime, setSelectedBookingTime] = useState('14:00 - 15:00');
  const [bookedSuccess, setBookedSuccess] = useState(false);

  // Sync simulator state when template changes
  React.useEffect(() => {
    setHabitsData(template.simulatorData.habits || []);
    setCartItems(template.id === 'dining' ? { d1: 1, d6: 1 } : {});
    setSelectedCategory('c1');
    setBookedSuccess(false);
  }, [template.id, template.simulatorData]);

  // Calculations for dining
  const allDishes = template.simulatorData.dishes || [];
  const totalCartCount = Object.values(cartItems).reduce((sum, n) => sum + n, 0);
  const totalCartPrice = Object.entries(cartItems).reduce((sum, [id, count]) => {
    const dish = allDishes.find((d: any) => d.id === id);
    return sum + (dish ? dish.price * count : 0);
  }, 0);

  const handleAddDish = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCartItems((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    onShowToast('已加入微信购物车');
  };

  const handleRemoveDish = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCartItems((prev) => {
      const updated = { ...prev };
      if (updated[id] > 1) {
        updated[id] -= 1;
      } else {
        delete updated[id];
      }
      return updated;
    });
  };

  const toggleHabit = (id: string) => {
    setHabitsData((prev: any[]) =>
      prev.map((h) => {
        if (h.id === id) {
          const next = !h.completed;
          onShowToast(next ? '🎉 打卡成功！坚持+1天' : '取消打卡状态');
          return {
            ...h,
            completed: next,
            streak: next ? h.streak + 1 : Math.max(0, h.streak - 1)
          };
        }
        return h;
      })
    );
  };

  const handleResetSimulator = () => {
    setCartItems({ d1: 1, d6: 1 });
    setSelectedCategory('c1');
    setHabitsData(template.simulatorData.habits || []);
    setBookedSuccess(false);
    onShowToast('模拟器数据已重置');
  };

  const currentActivePage = template.pages.find((p) => p.id === activePageId) || template.pages[0];

  return (
    <div className="flex flex-col items-center">
      {/* Simulator Toolbar */}
      <div className="flex items-center justify-between w-full max-w-[390px] mb-3 px-2 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium">
          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
          <span>微信运行环境 (WeChat 8.0+)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceModel(deviceModel === 'iphone15' ? 'se' : 'iphone15')}
            className="px-2 py-1 bg-white hover:bg-slate-200 rounded text-slate-700 transition"
            title="切换屏幕尺寸"
          >
            {deviceModel === 'iphone15' ? 'iPhone 15' : 'iPhone SE'}
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1 hover:bg-white rounded transition text-slate-700"
            title="切换微信深色模式"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleResetSimulator}
            className="p-1 hover:bg-white rounded transition text-slate-700"
            title="重置模拟数据"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Smartphone Chassis */}
      <div
        className={`relative transition-all duration-300 rounded-[44px] p-3 shadow-2xl border-[10px] ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-800'
        } ${
          deviceModel === 'iphone15'
            ? 'w-[375px] h-[760px]'
            : 'w-[350px] h-[680px]'
        }`}
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 ml-auto mr-3 border border-slate-700"></div>
        </div>

        {/* Inner Screen Container */}
        <div
          className={`w-full h-full rounded-[34px] overflow-hidden flex flex-col relative select-none ${
            isDarkMode ? 'bg-[#191919] text-white' : 'bg-[#F7F8FA] text-[#1D2129]'
          }`}
        >
          {/* iOS / WeChat Status Bar */}
          <div
            className="w-full h-11 pt-2 px-6 flex items-center justify-between text-[11px] font-semibold tracking-tight transition-colors"
            style={{
              backgroundColor: meta.themeColor,
              color: '#ffffff'
            }}
          >
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* WeChat Mini Program Navigation Bar with Iconic Capsule */}
          <div
            className="w-full h-11 px-4 flex items-center justify-between transition-colors shadow-sm relative z-20"
            style={{
              backgroundColor: meta.themeColor,
              color: '#ffffff'
            }}
          >
            <div className="flex items-center gap-1.5 max-w-[190px]">
              <span className="font-medium text-sm truncate">{currentActivePage.title}</span>
            </div>

            {/* WeChat Iconic Capsule Button (胶囊按钮) */}
            <div className="flex items-center h-7 rounded-full bg-black/25 backdrop-blur-md px-1.5 border border-white/20 text-white shadow-sm">
              <button
                onClick={() => setShowWechatMenu(true)}
                className="px-2 py-0.5 hover:opacity-80 active:scale-95 transition flex items-center justify-center"
                title="微信小程序菜单"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-3.5 bg-white/30 mx-0.5" />
              <button
                onClick={() => onShowToast('模拟点击退出微信小程序')}
                className="px-2 py-0.5 hover:opacity-80 active:scale-95 transition flex items-center justify-center"
                title="关闭/离开小程序"
              >
                <Circle className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Screen Content Viewport (Scrollable Page View) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative text-xs">
            {/* 0. Depth Video Mini Program Views */}
            {template.id === 'depth_video' && (
              <div className="p-3 space-y-3 pb-6">
                {/* Page: Index (Import & Parse) */}
                {activePageId === 'index' && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-4 rounded-2xl shadow-md">
                      <span className="px-2 py-0.5 bg-white/20 text-[9px] rounded-full font-semibold">
                        AI 灰度相对深度 MP4
                      </span>
                      <h4 className="text-sm font-bold mt-1">视频转灰度相对深度视频</h4>
                      <p className="text-[10px] text-indigo-200 mt-0.5">
                        基于 Depth Anything V2 · 近处亮、远处暗 · 专供 Seedance 等控制流
                      </p>
                    </div>

                    {/* Method 1: Douyin link input */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1">
                          <span>🔗</span> 方式一：粘贴抖音分享链接
                        </span>
                        <button
                          onClick={() => onShowToast('已读取手机微信剪贴板')}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-semibold"
                        >
                          读取剪贴板
                        </button>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-600 border border-slate-100 font-mono">
                        7.22 复制打开抖音，看看【都市夜景】https://v.douyin.com/iJ89ABC/
                      </div>
                      <button
                        onClick={() => {
                          onShowToast('正在提交服务端解析抖音视频并执行深度算法...');
                          setTimeout(() => onPageChange('process'), 600);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] shadow active:scale-95 transition"
                      >
                        提交解析并转深度视频 ›
                      </button>
                    </div>

                    {/* Method 2: Local video upload */}
                    <div
                      onClick={() => {
                        onShowToast('调用 wx.chooseMedia 选择本地 MP4/MOV 视频');
                        setTimeout(() => onPageChange('process'), 600);
                      }}
                      className="bg-white p-3 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 cursor-pointer text-center space-y-1 shadow-sm transition"
                    >
                      <div className="text-2xl">📹</div>
                      <div className="font-bold text-[11px] text-slate-800">
                        方式二：上传本地视频 (MP4 / MOV)
                      </div>
                      <div className="text-[9px] text-slate-400">
                        通过真实上传接口发送至后端执行 Python 深度算法
                      </div>
                    </div>

                    {/* Format specs */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                      <div className="font-bold text-[11px] text-slate-800">输出技术规格</div>
                      <div className="grid grid-cols-2 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
                          <div className="font-bold text-[10px]">H.264 灰度编码</div>
                          <div className="text-[8px] text-indigo-600 mt-0.5">近亮远暗 (0-255)</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                          <div className="font-bold text-[10px]">Depth Anything V2</div>
                          <div className="text-[8px] text-slate-500 mt-0.5">时序归一化防闪烁</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Page: Process (AI Engine) */}
                {activePageId === 'process' && (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center space-y-2.5">
                      <div className="w-16 h-16 rounded-full bg-indigo-50 border-4 border-indigo-500 mx-auto flex items-center justify-center font-bold text-sm text-indigo-700">
                        100%
                      </div>
                      <div className="font-bold text-xs text-slate-800">灰度深度视频生成完毕</div>
                      <p className="text-[10px] text-slate-500">
                        使用 Depth Anything V2 逐帧推导相对景深，并完成全局时序亮度归一化与 H.264 MP4 封装
                      </p>
                      <button
                        onClick={() => onPageChange('player')}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-[11px] shadow active:scale-95 transition"
                      >
                        预览灰度深度视频与下载 ›
                      </button>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">深度归一化算法</span>
                        <span className="font-bold text-indigo-600">全局分位数截断 (1%~99%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-indigo-600 rounded-full"></div>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        整段视频统一亮度映射基准，有效抑制帧间闪烁
                      </div>
                    </div>
                  </div>
                )}

                {/* Page: Player (Grayscale MP4 Preview & Download) */}
                {activePageId === 'player' && (
                  <div className="space-y-3">
                    <div className="bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                      <div className="px-3 py-1.5 bg-slate-900 text-white flex items-center justify-between text-[10px]">
                        <span>灰度深度 MP4 (近亮远暗)</span>
                        <span className="px-1.5 py-0.2 bg-indigo-600 rounded text-[9px]">H.264</span>
                      </div>
                      <div className="aspect-video bg-gradient-to-b from-slate-800 to-black flex items-center justify-center relative">
                        <div className="text-3xl text-white">🎬</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[10px] text-white/90">
                            已生成 H.264 灰度相对深度 MP4，供 Seedance 导入
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onShowToast('通过 wx.downloadFile 下载深度 MP4 到手机相册')}
                        className="py-2 bg-indigo-600 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 shadow"
                      >
                        <span>💾</span> 保存视频到相册
                      </button>
                      <button
                        onClick={() => onShowToast('复制视频直链，可直接在电脑浏览器中下载')}
                        className="py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span>🔗</span> 复制下载直链
                      </button>
                    </div>

                    {/* Seedance Guide */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-[10px] text-slate-600 space-y-1">
                      <div className="font-bold text-[11px] text-slate-800">
                        💡 Seedance / AI 视频生成指引
                      </div>
                      <p>
                        在 Seedance 或 ControlNet 中将此视频作为 Depth 条件输入，即可精准约束主体结构与镜头景深运镜。
                      </p>
                    </div>
                  </div>
                )}

                {/* Page: History */}
                {activePageId === 'history' && (
                  <div className="space-y-2">
                    <div className="font-bold text-[11px] text-slate-800">
                      深度视频任务历史 (wx.getStorageSync)
                    </div>
                    {template.simulatorData.recentConversions?.map((item: any) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onShowToast(`已载入：${item.title}`);
                          onPageChange('player');
                        }}
                        className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm flex gap-2.5 cursor-pointer hover:border-indigo-200"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 flex items-center justify-center text-lg text-white">
                          🎞️
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[11px] text-slate-800 truncate">
                            {item.title}
                          </div>
                          <div className="text-[9px] text-indigo-600 mt-0.5">
                            {item.source} · {item.model}
                          </div>
                          <div className="flex items-center justify-between text-[8px] text-slate-400 mt-1">
                            <span>{item.time}</span>
                            <span className="font-semibold text-emerald-600">已就绪 (MP4)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. Dining Mini Program Views */}
            {template.id === 'dining' && (
              <>
                {/* Dining Index Page */}
                {activePageId === 'index' && (
                  <div className="p-3 space-y-3 pb-6">
                    {/* Hero Banner Swiper */}
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 shadow-md">
                      <span className="inline-block px-2 py-0.5 text-[10px] bg-white/25 backdrop-blur-sm rounded-full mb-1">
                        店长诚意推荐
                      </span>
                      <h4 className="text-sm font-bold leading-snug">初秋轻盈特调 · 低卡能量碗</h4>
                      <p className="text-[11px] text-white/80 mt-0.5">全场第二件半价 · 微信专享礼</p>
                      <button
                        onClick={() => onPageChange('menu')}
                        className="mt-2.5 px-3 py-1 bg-white text-emerald-700 font-semibold text-[11px] rounded-full shadow hover:bg-slate-50 active:scale-95 transition"
                      >
                        立即选购 ›
                      </button>
                    </div>

                    {/* Quick Entry Cards */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div
                        onClick={() => onPageChange('menu')}
                        className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2.5 cursor-pointer hover:border-emerald-200 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                          🍱
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[12px]">堂食点餐</div>
                          <div className="text-[10px] text-slate-400">到店扫码免排队</div>
                        </div>
                      </div>
                      <div
                        onClick={() => onPageChange('menu')}
                        className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2.5 cursor-pointer hover:border-emerald-200 transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                          🛵
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[12px]">外卖配送</div>
                          <div className="text-[10px] text-slate-400">30分钟准时达</div>
                        </div>
                      </div>
                    </div>

                    {/* Hot Recommendation Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[13px] text-slate-900">人气当季热卖</span>
                        <button
                          onClick={() => onPageChange('menu')}
                          className="text-[11px] font-medium"
                          style={{ color: meta.themeColor }}
                        >
                          查看全部菜单 ›
                        </button>
                      </div>

                      <div className="space-y-2">
                        {template.simulatorData.dishes?.slice(0, 3).map((dish: any) => (
                          <div
                            key={dish.id}
                            className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3"
                          >
                            <div className="w-14 h-14 bg-emerald-50/60 rounded-xl flex items-center justify-center text-3xl">
                              {dish.image}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-[12px] truncate">
                                  {dish.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 bg-red-50 text-red-600 rounded">
                                  {dish.tag}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {dish.desc}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-red-500 font-bold text-[13px]">
                                    ¥{dish.price}
                                  </span>
                                  <span className="text-slate-400 line-through text-[10px]">
                                    ¥{dish.originalPrice}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => handleAddDish(dish.id, e)}
                                  className="px-2.5 py-1 text-white font-medium text-[10px] rounded-full shadow-sm hover:opacity-90 active:scale-95 transition"
                                  style={{ backgroundColor: meta.themeColor }}
                                >
                                  + 加购物车
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dining Menu Page */}
                {activePageId === 'menu' && (
                  <div className="flex h-full pb-16">
                    {/* Left Category Sidebar */}
                    <div className="w-20 bg-slate-100 border-r border-slate-200 overflow-y-auto py-1">
                      {template.simulatorData.categories?.map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full py-3 px-2 text-left text-[11px] font-medium transition ${
                            selectedCategory === cat.id
                              ? 'bg-white text-emerald-600 font-bold border-l-4 border-emerald-500'
                              : 'text-slate-600 hover:bg-slate-200/50'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Right Dishes Scroll */}
                    <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        {template.simulatorData.categories?.find((c: any) => c.id === selectedCategory)?.name || '精品推荐'}
                      </div>
                      {allDishes
                        .filter((d: any) => (selectedCategory === 'c1' ? true : d.catId === selectedCategory))
                        .map((dish: any) => {
                          const count = cartItems[dish.id] || 0;
                          return (
                            <div
                              key={dish.id}
                              className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex gap-2.5"
                            >
                              <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0">
                                {dish.image}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 text-[11px] truncate">
                                  {dish.name}
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">
                                  月售{dish.sales} · 好评{dish.rating}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-red-500 font-bold text-[12px]">
                                    ¥{dish.price}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {count > 0 && (
                                      <>
                                        <button
                                          onClick={(e) => handleRemoveDish(dish.id, e)}
                                          className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center active:scale-95"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="font-bold text-[11px] min-w-3 text-center">
                                          {count}
                                        </span>
                                      </>
                                    )}
                                    <button
                                      onClick={(e) => handleAddDish(dish.id, e)}
                                      className="w-5 h-5 rounded-full text-white flex items-center justify-center active:scale-95"
                                      style={{ backgroundColor: meta.themeColor }}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Floating Cart Checkout Bar */}
                    {totalCartCount > 0 && (
                      <div className="absolute bottom-2 left-3 right-3 bg-slate-900 text-white rounded-full p-2 pl-3 flex items-center justify-between shadow-xl z-30 animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: meta.themeColor }}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </div>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                              {totalCartCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white">¥{totalCartPrice}</span>
                            <span className="text-[9px] text-slate-400 ml-1.5">已享减5元</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPayModal(true)}
                          className="px-4 py-1.5 rounded-full text-[11px] font-bold text-white hover:opacity-95 active:scale-95 transition"
                          style={{ backgroundColor: meta.themeColor }}
                        >
                          去结算
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Dining Orders Page */}
                {activePageId === 'order' && (
                  <div className="p-3 space-y-3 pb-6">
                    <div className="text-[12px] font-bold text-slate-800">全部微信订单</div>
                    {template.simulatorData.orders?.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[10px] text-slate-400">{ord.id}</span>
                          <span
                            className="font-bold text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${meta.themeColor}18`,
                              color: meta.themeColor
                            }}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-800">{ord.items}</div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] text-slate-400">{ord.time}</div>
                          <div className="font-bold text-[12px] text-slate-900">
                            实付 ¥{ord.total}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1 border-t border-slate-50">
                          <button
                            onClick={() => setShowPickupModal(ord.pickupCode)}
                            className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1"
                          >
                            <QrCode className="w-3 h-3" /> 取餐码 ({ord.pickupCode})
                          </button>
                          <button
                            onClick={() => onShowToast('已开具微信电子发票')}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px]"
                          >
                            开发票
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dining Profile Page */}
                {activePageId === 'my' && (
                  <div className="p-3 space-y-3 pb-6">
                    {/* User Header */}
                    <div
                      className="rounded-2xl p-4 text-white shadow-md flex items-center gap-3"
                      style={{ backgroundColor: meta.themeColor }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xl">
                        🥑
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">微信用户_Haibo</div>
                        <div className="text-[10px] opacity-80 mt-0.5">VIP 白金会员 · 享8.8折</div>
                      </div>
                    </div>

                    {/* Member Stats */}
                    <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">480</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">积分商城</div>
                      </div>
                      <div className="border-x border-slate-100">
                        <div className="text-[14px] font-bold text-slate-800">3张</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">专享优惠券</div>
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-slate-800">¥128.5</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">会员储值</div>
                      </div>
                    </div>

                    {/* WeUI Style Menu List */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
                      <div
                        onClick={() => onShowToast('已跳转收货地址管理')}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700">我的收货地址</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div
                        onClick={() => onShowToast('已唤起微信官方客服')}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700">微信在线客服</span>
                        <span className="text-[10px] text-emerald-600">服务时间 9:00-22:00</span>
                      </div>
                      <div
                        onClick={() => onShowToast('已打开微信小程序隐私协议')}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-700">小程序隐私与授权管理</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. Booking Mini Program Views */}
            {template.id === 'booking' && (
              <div className="p-3 space-y-3 pb-6">
                {activePageId === 'index' && (
                  <>
                    <div className="rounded-2xl p-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-md">
                      <span className="px-2 py-0.5 bg-white/20 text-[9px] rounded-full">
                        本周力荐
                      </span>
                      <h4 className="text-sm font-bold mt-1">日式深层水光毛孔修护</h4>
                      <p className="text-[10px] text-purple-200 mt-0.5">
                        首席芳疗师主理 · 提前预约免排队
                      </p>
                      <button
                        onClick={() => onPageChange('services')}
                        className="mt-2.5 px-3 py-1 bg-white text-purple-700 font-bold rounded-full text-[10px]"
                      >
                        查看预约档期 ›
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-[12px] text-slate-800">热门定制项目</div>
                      {template.simulatorData.services?.map((svc: any) => (
                        <div
                          key={svc.id}
                          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">
                            {svc.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-slate-800 text-[11px]">{svc.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {svc.duration} · {svc.specialist}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="font-bold text-purple-700 text-[12px]">
                                ¥{svc.price}
                              </span>
                              <button
                                onClick={() => onPageChange('services')}
                                className="px-2.5 py-1 bg-purple-600 text-white rounded-full text-[10px] font-medium"
                              >
                                预约
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activePageId === 'services' && (
                  <div className="space-y-3">
                    <div className="font-bold text-[12px] text-slate-800">选择服务与预约时间</div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
                      <div className="text-[11px] font-medium text-slate-700">
                        已选项目：日式深层水光毛孔修护 (60分钟)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        主理芳疗师：Elena (好评率 99.8%)
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-700 mb-1.5">
                          选择预约时段：
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {template.simulatorData.timeSlots?.map((slot: string) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedBookingTime(slot)}
                              className={`py-1.5 px-2 rounded-lg text-[10px] font-medium transition ${
                                selectedBookingTime === slot
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setBookedSuccess(true);
                          onShowToast('微信预约提交成功！已发送服务提醒');
                          setTimeout(() => onPageChange('records'), 800);
                        }}
                        className="w-full mt-2 py-2 bg-purple-600 text-white font-bold rounded-xl text-[11px] shadow hover:bg-purple-700 active:scale-95 transition"
                      >
                        确认微信预约 (免预付)
                      </button>
                    </div>
                  </div>
                )}

                {activePageId === 'records' && (
                  <div className="space-y-2.5">
                    <div className="font-bold text-[12px] text-slate-800">我的到店核销码</div>
                    <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-sm text-center space-y-2">
                      <div className="w-28 h-28 mx-auto bg-slate-900 rounded-xl p-2 flex items-center justify-center text-white">
                        <QrCode className="w-20 h-20" />
                      </div>
                      <div className="text-[14px] font-mono font-bold tracking-widest text-purple-700">
                        6829 - 4103
                      </div>
                      <p className="text-[10px] text-slate-500">
                        到店请向美疗师出示以上核销二维码
                      </p>
                      <div className="bg-purple-50 p-2 rounded-xl text-[10px] text-purple-800 text-left">
                        <div>📅 时间：明天 (周四) {selectedBookingTime}</div>
                        <div>💆 项目：日式深层水光毛孔修护</div>
                        <div>📍 地址：朝阳区三里屯 SOHO 6号商场 3层308</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePageId === 'my' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto flex items-center justify-center text-xl">
                      👑
                    </div>
                    <div className="font-bold text-[13px] text-slate-800 mt-2">
                      悦己黑金尊享卡
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">享受全场8.5折 · 生日专属SPA</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Business Mini Program Views */}
            {template.id === 'business' && (
              <div className="p-3 space-y-3 pb-6">
                {activePageId === 'index' && (
                  <>
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md">
                      <span className="px-2 py-0.5 bg-blue-500/30 text-[9px] rounded-full border border-blue-400/30">
                        国家级高新技术企业
                      </span>
                      <h3 className="text-sm font-bold mt-1">创界智能科技 · 智领工业未来</h3>
                      <p className="text-[10px] text-blue-200 mt-0.5">
                        赋能企业工业物联网与大模型知识中台
                      </p>
                      <button
                        onClick={() => onPageChange('card')}
                        className="mt-3 px-3 py-1 bg-white text-blue-900 font-bold rounded-full text-[10px]"
                      >
                        联系商务负责人 ›
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm text-center">
                      {template.simulatorData.highlights?.map((h: any) => (
                        <div key={h.label}>
                          <div className="font-bold text-[12px] text-blue-700">{h.value}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{h.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-[12px] text-slate-800">核心行业解决方案</div>
                      {template.simulatorData.solutions?.map((sol: any) => (
                        <div
                          key={sol.id}
                          className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-[11px]">
                              {sol.title}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                              {sol.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{sol.desc}</p>
                          <div className="text-[9px] text-blue-600 font-medium mt-1.5">
                            ⚡ {sol.metric}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activePageId === 'card' && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-4 rounded-2xl shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-base text-white shadow">
                          Alex
                        </div>
                        <div>
                          <div className="font-bold text-sm">
                            {template.simulatorData.cardInfo.name}
                          </div>
                          <div className="text-[10px] text-blue-300">
                            {template.simulatorData.cardInfo.title}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[10px] text-slate-300">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-blue-400" />
                          <span>{template.simulatorData.cardInfo.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-blue-400" />
                          <span>{template.simulatorData.cardInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          <span className="truncate">{template.simulatorData.cardInfo.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onShowToast('已模拟保存联系人至手机通讯录')}
                        className="py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow"
                      >
                        <Phone className="w-3 h-3" /> 一键拨打电话
                      </button>
                      <button
                        onClick={() => onShowToast('已生成微信分享商务海报')}
                        className="py-2 bg-white text-blue-800 border border-blue-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Share2 className="w-3 h-3" /> 分享名片海报
                      </button>
                    </div>
                  </div>
                )}

                {activePageId === 'products' && (
                  <div className="space-y-2">
                    <div className="font-bold text-[12px] text-slate-800">产品架构与演示白皮书</div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                      <div className="text-[11px] font-bold text-slate-800">
                        2026 企业智能物联网白皮书 (PDF)
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">包含 50+ 顶级企业实际落地案例</p>
                      <button
                        onClick={() => onShowToast('已通过微信服务通知发送下载链接')}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-full text-[10px]"
                      >
                        微信一键索取
                      </button>
                    </div>
                  </div>
                )}

                {activePageId === 'contact' && (
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="font-bold text-[12px] text-slate-800">全国总部与到访指引</div>
                    <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-[11px]">
                      🗺️ 微信腾讯地图坐标已加载
                    </div>
                    <button
                      onClick={() => onShowToast('已打开微信腾讯地图导航')}
                      className="w-full py-1.5 bg-blue-600 text-white text-[10px] rounded-lg font-bold"
                    >
                      一键开启地图导航
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. Habits Mini Program Views */}
            {template.id === 'habits' && (
              <div className="p-3 space-y-3 pb-6">
                {activePageId === 'index' && (
                  <>
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-orange-100">坚持自律第 24 天</div>
                        <h4 className="text-sm font-bold mt-0.5">今天也要全力以赴！</h4>
                        <div className="text-[10px] opacity-80 mt-1">
                          已完成{' '}
                          {habitsData.filter((h: any) => h.completed).length} / {habitsData.length}
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                        🔥
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-bold text-[12px] text-slate-800">今日打卡目标清单</div>
                      {habitsData.map((habit: any) => (
                        <div
                          key={habit.id}
                          onClick={() => toggleHabit(habit.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            habit.completed
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-white border-slate-100 shadow-sm hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{habit.icon}</span>
                            <div>
                              <div
                                className={`text-[11px] font-bold ${
                                  habit.completed ? 'line-through text-slate-400' : 'text-slate-800'
                                }`}
                              >
                                {habit.name}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                连续坚持 {habit.streak} 天 · {habit.target}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                              habit.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activePageId === 'stats' && (
                  <div className="space-y-2.5">
                    <div className="font-bold text-[12px] text-slate-800">我的坚持成就勋章</div>
                    <div className="grid grid-cols-3 gap-2">
                      {template.simulatorData.badges?.map((badge: any) => (
                        <div
                          key={badge.id}
                          className={`p-3 rounded-2xl border text-center ${
                            badge.unlocked
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="text-2xl">{badge.icon}</div>
                          <div className="font-bold text-[11px] text-slate-800 mt-1">
                            {badge.name}
                          </div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{badge.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePageId === 'community' && (
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="text-[11px] font-bold text-slate-800">自律星人打卡圈</div>
                    <div className="text-[10px] text-slate-500">
                      用户小明 刚刚完成了「早起晨跑5公里」，坚持第 31 天！
                    </div>
                    <div className="text-[10px] text-slate-500">
                      用户Lin 刚刚完成了「背单词40个」，坚持第 56 天！
                    </div>
                  </div>
                )}

                {activePageId === 'settings' && (
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
                    <button
                      onClick={() => onShowToast('已打开微信每日打卡提醒推送设置')}
                      className="w-full py-2 bg-orange-600 text-white text-[11px] font-bold rounded-xl"
                    >
                      开启微信订阅消息每日提醒
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WeChat TabBar Component (微信底部原生TabBar) */}
          <div className="w-full h-14 bg-white border-t border-slate-200/80 flex items-center justify-around px-2 z-20 flex-shrink-0">
            {template.tabBar.map((tab) => {
              const isActive = tab.pagePath.includes(activePageId);
              return (
                <button
                  key={tab.pagePath}
                  onClick={() => {
                    const matchedPage = template.pages.find((p) => p.path === tab.pagePath);
                    if (matchedPage) {
                      onPageChange(matchedPage.id);
                    }
                  }}
                  className="flex flex-col items-center justify-center flex-1 py-1 relative active:scale-95 transition"
                >
                  <div className="relative">
                    {/* Render Tab Icons */}
                    <span className="text-lg leading-none">
                      {tab.text === '首页' || tab.text === '今日'
                        ? '🏠'
                        : tab.text === '点餐' || tab.text === '方案'
                        ? '🍽️'
                        : tab.text === '预约' || tab.text === '方案'
                        ? '📅'
                        : tab.text === '订单' || tab.text === '行程' || tab.text === '成就'
                        ? '📋'
                        : '👤'}
                    </span>
                    {/* WeChat TabBar Badge */}
                    {tab.text === '点餐' && totalCartCount > 0 && (
                      <span className="absolute -top-1 -right-2 px-1 min-w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {totalCartCount}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] mt-0.5 font-medium"
                    style={{
                      color: isActive ? meta.themeColor : '#8A8A8A'
                    }}
                  >
                    {tab.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* WeChat Native ActionSheet Menu Overlay (胶囊按钮菜单) */}
          {showWechatMenu && (
            <div
              className="absolute inset-0 bg-black/50 z-50 flex flex-col justify-end animate-in fade-in"
              onClick={() => setShowWechatMenu(false)}
            >
              <div
                className="bg-white rounded-t-3xl p-4 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: meta.themeColor }}
                    >
                      微
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">{meta.appName}</div>
                      <div className="text-[9px] text-slate-400">微信小程序</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWechatMenu(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center py-2">
                  <button
                    onClick={() => {
                      setShowWechatMenu(false);
                      onShowToast('模拟唤起微信转发好友面板');
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-200">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-600">转发给朋友</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowWechatMenu(false);
                      onShowToast('模拟分享到微信朋友圈');
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-200">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-600">分享朋友圈</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowWechatMenu(false);
                      onShowToast('已添加到「我的小程序」快捷入口');
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-200">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-600">添加小程序</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowWechatMenu(false);
                      handleResetSimulator();
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-700 hover:bg-slate-200">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-slate-600">重新进入</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowWechatMenu(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* WeChat Pay Simulation Modal */}
          {showPayModal && (
            <div
              className="absolute inset-0 bg-black/60 z-50 flex flex-col justify-end animate-in fade-in"
              onClick={() => setShowPayModal(false)}
            >
              <div
                className="bg-white rounded-t-3xl p-5 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                      ¥
                    </div>
                    <span className="font-bold text-xs text-slate-800">微信支付收银台</span>
                  </div>
                  <button onClick={() => setShowPayModal(false)} className="text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center py-2">
                  <div className="text-[10px] text-slate-400">麦香轻食点餐 - 微信商户号</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ¥{(totalCartPrice * 0.9).toFixed(1)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    已自动使用微信满减优惠券 -¥5.0
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-[10px] text-slate-600">
                  <div className="flex justify-between">
                    <span>支付方式</span>
                    <span className="font-semibold text-slate-800">微信零钱 (剩余 ¥890.00)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>微信扣款账户</span>
                    <span>138****0505</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPayModal(false);
                    setCartItems({});
                    onShowToast('✅ 微信支付成功！订单已下发厨房');
                    onPageChange('order');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition"
                >
                  确认微信指纹 / 密码支付
                </button>
              </div>
            </div>
          )}

          {/* Pickup QR Code Modal */}
          {showPickupModal && (
            <div
              className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
              onClick={() => setShowPickupModal(null)}
            >
              <div
                className="bg-white rounded-3xl p-5 text-center space-y-3 w-full max-w-[280px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="font-bold text-sm text-slate-800">到店取餐码</div>
                <div className="text-2xl font-mono font-bold text-emerald-600 tracking-wider">
                  {showPickupModal}
                </div>
                <div className="w-36 h-36 bg-slate-900 mx-auto rounded-2xl flex items-center justify-center text-white p-2">
                  <QrCode className="w-28 h-28" />
                </div>
                <p className="text-[10px] text-slate-400">请至前台出示二维码扫码取餐</p>
                <button
                  onClick={() => setShowPickupModal(null)}
                  className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  返回
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
