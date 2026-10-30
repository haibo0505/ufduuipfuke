import { MiniProgramTemplate } from '../types/miniprogram';

export const TEMPLATES: MiniProgramTemplate[] = [
  {
    id: 'depth_video',
    name: '幻深 · 抖音/视频转灰度深度视频',
    tagline: '抖音无水印解析提取 · 单目视频逐帧转 H.264 灰度深度视频 (供 Seedance 等 AI 工具使用)',
    category: 'AI 计算机视觉 / 深度估计',
    themeColor: '#2563EB', // Professional deep blue
    icon: 'Layers',
    description: '严格基于 Depth Anything V2 算法与统一时序归一化，将普通视频转换为近亮远暗的 H.264 灰度深度 MP4 视频，支持抖音链接解析提取与手机本地相册上传。',
    defaultAppId: 'touristappid',
    pages: [
      { id: 'index', name: '视频导入', path: 'pages/index/index', title: '视频导入与抖音链接' },
      { id: 'process', name: '深度计算', path: 'pages/process/process', title: '深度估计任务处理' },
      { id: 'player', name: '结果播放', path: 'pages/player/player', title: '灰度深度视频播放' },
      { id: 'history', name: '历史记录', path: 'pages/history/history', title: '转换历史与保存相册' }
    ],
    tabBar: [
      { pagePath: 'pages/index/index', text: '转换', iconName: 'Sparkles' },
      { pagePath: 'pages/player/player', text: '播放', iconName: 'PlayCircle' },
      { pagePath: 'pages/history/history', text: '历史', iconName: 'FolderVideo' }
    ],
    simulatorData: {
      recentConversions: []
    }
  },
  {
    id: 'dining',
    name: '麦香轻食点餐',
    tagline: '智慧外卖与堂食点餐小程序',
    category: '餐饮美食 / 扫码点餐',
    themeColor: '#07C160', // WeChat classic green
    icon: 'Utensils',
    description: '支持轮播推荐、分类联动点餐、多规格加购、购物车浮层结算与模拟微信支付。',
    defaultAppId: 'touristappid',
    pages: [
      { id: 'index', name: '首页推荐', path: 'pages/index/index', title: '麦香轻食·匠心甄选' },
      { id: 'menu', name: '点餐选购', path: 'pages/menu/menu', title: '精选手作轻食菜单' },
      { id: 'order', name: '我的订单', path: 'pages/order/order', title: '订单列表与取餐码' },
      { id: 'my', name: '个人中心', path: 'pages/my/my', title: '会员特权与优惠券' }
    ],
    tabBar: [
      { pagePath: 'pages/index/index', text: '首页', iconName: 'Home' },
      { pagePath: 'pages/menu/menu', text: '点餐', iconName: 'UtensilsCrossed', badge: 3 },
      { pagePath: 'pages/order/order', text: '订单', iconName: 'FileText' },
      { pagePath: 'pages/my/my', text: '我的', iconName: 'User' }
    ],
    simulatorData: {
      banners: [
        { id: 1, title: '初秋轻盈特调 · 低卡牛油果能量碗', subtitle: '买一送一 限时立享', tag: '店长力荐', color: 'from-emerald-600 to-teal-700' },
        { id: 2, title: '高蛋白慢烤牛排温沙拉', subtitle: '仅需 29.9 元起', tag: '爆款尝鲜', color: 'from-amber-600 to-orange-700' },
        { id: 3, title: '新用户立领 15 元全场无门槛券', subtitle: '微信扫码一键入会', tag: '专享新人礼', color: 'from-rose-600 to-pink-700' }
      ],
      categories: [
        { id: 'c1', name: '🔥 热销爆款' },
        { id: 'c2', name: '🥗 能量沙拉' },
        { id: 'c3', name: '🥪 手作轻三明治' },
        { id: 'c4', name: '🥤 低卡鲜果特饮' },
        { id: 'c5', name: '🥣 慢炖暖心浓汤' }
      ],
      dishes: [
        { id: 'd1', catId: 'c1', name: '香煎三文鱼牛油果谷物碗', price: 38, originalPrice: 48, sales: 1240, rating: 4.9, desc: '甄选深海三文鱼，搭配新鲜牛油果与七色藜麦', tag: '镇店之宝', image: '🥑' },
        { id: 'd2', catId: 'c1', name: '迷迭香炙烤黑椒嫩牛肉沙拉', price: 35, originalPrice: 42, sales: 980, rating: 4.8, desc: '低温慢煮澳洲谷饲牛排，肉质细嫩多汁', tag: '增肌首选', image: '🥩' },
        { id: 'd3', catId: 'c2', name: '秘制照烧鸡胸藜麦饭', price: 26, originalPrice: 32, sales: 1560, rating: 4.9, desc: '少油少盐特制酱汁，能量满满不长肉', tag: '回购王', image: '🍗' },
        { id: 'd4', catId: 'c2', name: '田园阳光彩虹果蔬盘', price: 22, originalPrice: 28, sales: 430, rating: 4.7, desc: '罗马生菜、羽衣甘蓝配低脂油醋汁', tag: '纯素', image: '🥗' },
        { id: 'd5', catId: 'c3', name: '全麦滑蛋大虾三明治', price: 24, originalPrice: 29, sales: 880, rating: 4.9, desc: '黑全麦吐司夹嫩滑炒蛋与鲜甜南美白虾', tag: '早餐必点', image: '🥪' },
        { id: 'd6', catId: 'c4', name: '生打椰椰抹茶冰萃', price: 18, originalPrice: 22, sales: 2100, rating: 5.0, desc: '纯正宇治抹茶粉碰撞鲜椰乳，清甜不腻', tag: '人气饮品', image: '🍵' },
        { id: 'd7', catId: 'c4', name: '鲜榨羽衣甘蓝青苹果汁', price: 16, originalPrice: 20, sales: 650, rating: 4.8, desc: '不加一滴糖，天然抗氧化高膳食纤维', tag: '减脂神水', image: '🍏' }
      ],
      orders: [
        { id: 'ORD-20261028-091', time: '今天 12:15', status: '制作中', pickupCode: 'A-28', total: 62, items: '香煎三文鱼牛油果谷物碗 x1, 生打椰椰抹茶冰萃 x1' },
        { id: 'ORD-20261027-184', time: '昨天 18:30', status: '已完成', pickupCode: 'B-09', total: 35, items: '迷迭香炙烤黑椒嫩牛肉沙拉 x1' }
      ],
      user: {
        name: '微信用户_Haibo',
        phone: '138****0505',
        points: 480,
        coupons: 3,
        balance: 128.5
      }
    }
  },
  {
    id: 'booking',
    name: '悦己美学沙龙',
    tagline: '生活美业与专享服务预约小程序',
    category: '丽人美业 / 预约服务',
    themeColor: '#7C3AED', // Premium violet
    icon: 'Calendar',
    description: '支持名师技师展示、预约时段选择、智能排班日历、到店核销码生成与微信订阅消息通知。',
    defaultAppId: 'touristappid',
    pages: [
      { id: 'index', name: '沙龙精选', path: 'pages/index/index', title: '悦己美学·专属定制' },
      { id: 'services', name: '预约服务', path: 'pages/services/services', title: '高端护理预约' },
      { id: 'records', name: '预约行程', path: 'pages/records/records', title: '我的到店预约单' },
      { id: 'my', name: '会员特权', path: 'pages/my/my', title: '会员储值与优惠' }
    ],
    tabBar: [
      { pagePath: 'pages/index/index', text: '精选', iconName: 'Sparkles' },
      { pagePath: 'pages/services/services', text: '预约', iconName: 'Calendar' },
      { pagePath: 'pages/records/records', text: '行程', iconName: 'Clock', badge: 1 },
      { pagePath: 'pages/my/my', text: '我的', iconName: 'User' }
    ],
    simulatorData: {
      services: [
        { id: 's1', name: '日式深层水光毛孔修护', duration: '60分钟', price: 298, originalPrice: 480, tag: '新手特惠', specialist: 'Elena 首席芳疗师', rating: 4.95, icon: '✨' },
        { id: 's2', name: '头皮微生态赋活 SPA', duration: '75分钟', price: 368, originalPrice: 580, tag: '减压助眠', specialist: 'Kimi 资深理疗顾问', rating: 4.98, icon: '💆' },
        { id: 's3', name: '高定轻氧法式美睫美甲组合', duration: '90分钟', price: 399, originalPrice: 620, tag: '明星同款', specialist: 'Zoe 美学设计总监', rating: 5.0, icon: '💅' },
        { id: 's4', name: '肩颈经络温阳舒缓疗愈', duration: '45分钟', price: 198, originalPrice: 280, tag: '办公族解乏', specialist: 'Amy 金牌技师', rating: 4.9, icon: '🌿' }
      ],
      timeSlots: ['10:00 - 11:00', '11:30 - 12:30', '14:00 - 15:00', '15:30 - 16:30', '17:00 - 18:00', '19:00 - 20:00'],
      bookings: [
        { id: 'BK-8902', serviceName: '日式深层水光毛孔修护', date: '明天 (周四)', timeSlot: '14:00 - 15:00', specialist: 'Elena 首席芳疗师', status: '待到店', verifyCode: '6829-4103' }
      ]
    }
  },
  {
    id: 'business',
    name: '创界智能科技',
    tagline: '科技企业形象展示与商务名片小程序',
    category: '企业官网 / 智能名片',
    themeColor: '#1E40AF', // Enterprise tech blue
    icon: 'Building2',
    description: '企业实力展示、全景案例视频、核心产品方案、微信授权一键拨号、微信地图导航及分享名片海报。',
    defaultAppId: 'touristappid',
    pages: [
      { id: 'index', name: '企业首页', path: 'pages/index/index', title: '创界科技·智领未来' },
      { id: 'products', name: '产品方案', path: 'pages/products/products', title: '核心智能硬件与云方案' },
      { id: 'card', name: '商务名片', path: 'pages/card/card', title: '合伙人电子名片' },
      { id: 'contact', name: '联系我们', path: 'pages/contact/contact', title: '商务洽谈与到访路线' }
    ],
    tabBar: [
      { pagePath: 'pages/index/index', text: '首页', iconName: 'Building' },
      { pagePath: 'pages/products/products', text: '方案', iconName: 'Layers' },
      { pagePath: 'pages/card/card', text: '名片', iconName: 'CreditCard' },
      { pagePath: 'pages/contact/contact', text: '联系', iconName: 'Phone' }
    ],
    simulatorData: {
      highlights: [
        { label: '企业客户', value: '500+' },
        { label: '专利技术', value: '86项' },
        { label: '交付上线', value: '99.98%' },
        { label: '全球分支', value: '12座' }
      ],
      solutions: [
        { id: 'sol-1', title: '工业物联网边缘智算平台', desc: '毫秒级感知决策，助力制造业数字化降本增效 35%', tag: '行业标杆', metric: '支持10万+设备并发' },
        { id: 'sol-2', title: '大模型智能客服与知识中台', desc: '私有化部署，深度融入企业 ERP 与 CRM 工作流', tag: 'AI赋能', metric: '问题自解率 88%' },
        { id: 'sol-3', title: '智慧园区能碳协同管理系统', desc: '全时段能耗分析与碳足迹追踪，绿色可持续认证', tag: '双碳方案', metric: '年节约能耗 22%' }
      ],
      cardInfo: {
        name: '张宇翔 (Alex Zhang)',
        title: '商业化副总裁 / 联合创始人',
        company: '创界智能科技有限公司',
        phone: '186-0021-9988',
        email: 'alex.zhang@crebound-ai.com',
        wechat: 'AlexZhang_Tech',
        address: '北京市海淀区中关村软件园二期人工智能创新大厦 9 层'
      }
    }
  },
  {
    id: 'habits',
    name: '微习惯自律打卡',
    tagline: '日常目标打卡与习惯养成小程序',
    category: '工具效率 / 生活记录',
    themeColor: '#EA580C', // Vibrant orange
    icon: 'CheckCircle2',
    description: '极简目标打卡、连续天数坚持激励、习惯统计日历、微信朋友圈海报生成与离线存储（wx.setStorageSync）。',
    defaultAppId: 'touristappid',
    pages: [
      { id: 'index', name: '今日打卡', path: 'pages/index/index', title: '自律让我更自由' },
      { id: 'stats', name: '统计成就', path: 'pages/stats/stats', title: '我的坚持轨迹与徽章' },
      { id: 'community', name: '自律广场', path: 'pages/community/community', title: '全国自律星人圈子' },
      { id: 'settings', name: '设置目标', path: 'pages/settings/settings', title: '习惯管理与提醒' }
    ],
    tabBar: [
      { pagePath: 'pages/index/index', text: '今日', iconName: 'CheckSquare' },
      { pagePath: 'pages/stats/stats', text: '成就', iconName: 'Award' },
      { pagePath: 'pages/community/community', text: '广场', iconName: 'Users' },
      { pagePath: 'pages/settings/settings', text: '管理', iconName: 'Settings' }
    ],
    simulatorData: {
      habits: [
        { id: 'h1', name: '早起一杯温开水 (500ml)', icon: '💧', target: '每天', streak: 18, completed: true, color: 'bg-blue-500' },
        { id: 'h2', name: '无氧运动 & 腹肌训练 30分钟', icon: '🏋️', target: '每周5次', streak: 9, completed: true, color: 'bg-orange-500' },
        { id: 'h3', name: '深度阅读 20 页书籍', icon: '📖', target: '每天', streak: 24, completed: false, color: 'bg-emerald-500' },
        { id: 'h4', name: '复盘今日工作与次日计划', icon: '📝', target: '工作日', streak: 5, completed: false, color: 'bg-purple-500' },
        { id: 'h5', name: '睡前远离手机 / 23:00 前熄灯', icon: '🌙', target: '每天', streak: 12, completed: false, color: 'bg-indigo-500' }
      ],
      badges: [
        { id: 'b1', name: '启航新星', desc: '完成首次连续7天打卡', icon: '🌟', unlocked: true },
        { id: 'b2', name: '习惯大师', desc: '任意习惯坚持满21天', icon: '🏆', unlocked: true },
        { id: 'b3', name: '百日筑梦', desc: '累计打卡超过100次', icon: '🚀', unlocked: false }
      ]
    }
  }
];
