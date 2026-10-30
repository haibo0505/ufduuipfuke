import { MiniProgramFile, MiniProgramMeta, MiniProgramTemplate } from '../types/miniprogram';

export function generateMiniProgramFiles(
  template: MiniProgramTemplate,
  meta: MiniProgramMeta
): MiniProgramFile[] {
  const files: MiniProgramFile[] = [];

  // 1. project.config.json (WeChat DevTools configuration)
  files.push({
    path: 'project.config.json',
    name: 'project.config.json',
    type: 'json',
    description: '微信开发者工具工程配置，包含 AppID、miniprogramRoot 根目录声明、基础库配置及打包设置',
    content: JSON.stringify(
      {
        description: `${meta.appName} - 微信小程序项目配置文件`,
        miniprogramRoot: '.',
        packOptions: {
          ignore: []
        },
        setting: {
          urlCheck: false,
          es6: true,
          enhance: true,
          postcss: true,
          preloadBackgroundData: false,
          minified: true,
          newFeature: true,
          coverView: true,
          nodeModules: false,
          autoAudits: false,
          showShadowRootInWxmlPanel: true,
          scopeDataCheck: false,
          uglifyFileName: false,
          checkInvalidKey: true,
          checkSiteMap: true,
          uploadWithSourceMap: true,
          compileHotReLoad: true,
          lazyCodeLoading: 'requiredComponents'
        },
        compileType: 'miniprogram',
        libVersion: '3.4.0',
        appid: meta.appId || 'touristappid',
        projectname: meta.appName,
        condition: {}
      },
      null,
      2
    )
  });

  // 1b. project.private.config.json (WeChat DevTools local private settings - never overrides miniprogramRoot)
  files.push({
    path: 'project.private.config.json',
    name: 'project.private.config.json',
    type: 'json',
    description: '微信开发者工具本地私有配置，默认开启热重载与关闭域名校验，不覆盖源码根目录配置',
    content: JSON.stringify(
      {
        description: `${meta.appName} - 私有配置文件`,
        projectname: meta.appName,
        setting: {
          compileHotReLoad: true,
          urlCheck: false
        }
      },
      null,
      2
    )
  });

  // 2. sitemap.json (WeChat search indexing config)
  files.push({
    path: 'sitemap.json',
    name: 'sitemap.json',
    type: 'json',
    description: '微信小程序页面索引配置，规定微信搜索微信公众平台的爬虫规则',
    content: JSON.stringify(
      {
        desc: '关于本小程序在微信搜索的配置规则',
        rules: [
          {
            action: 'allow',
            page: '*'
          }
        ]
      },
      null,
      2
    )
  });

  // 3. app.json (Global configuration: pages, window, tabBar)
  const appJsonContent = {
    pages: template.pages.map((p) => p.path),
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: meta.themeColor,
      navigationBarTitleText: meta.appName,
      navigationBarTextStyle: 'white'
    },
    tabBar: {
      color: '#8A8A8A',
      selectedColor: meta.themeColor,
      backgroundColor: '#FFFFFF',
      borderStyle: 'black',
      list: template.tabBar.map((tab) => ({
        pagePath: tab.pagePath,
        text: tab.text
      }))
    },
    style: 'v2',
    sitemapLocation: 'sitemap.json',
    lazyCodeLoading: 'requiredComponents'
  };

  files.push({
    path: 'app.json',
    name: 'app.json',
    type: 'json',
    description: '全局配置文件，声明所有页面路径、窗口外观、顶部导航与底部 TabBar',
    content: JSON.stringify(appJsonContent, null, 2)
  });

  // 4. app.wxss (Global styling)
  files.push({
    path: 'app.wxss',
    name: 'app.wxss',
    type: 'wxss',
    description: '全局公共样式表，定义标准 rpx 响应式间距、主题色变量与基础排版',
    content: `/**
 * @file app.wxss - 全局微信小程序样式
 * ${meta.appName}
 */

page {
  --primary-color: ${meta.themeColor};
  --bg-color: #F7F8FA;
  --text-main: #1D2129;
  --text-sub: #86909C;
  --border-color: #E5E6EB;

  background-color: var(--bg-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
    Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB',
    'Microsoft Yahei', sans-serif;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
}

/* 微信通用浮动与弹性盒模型 */
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.flex-between {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 微信标准卡片与投影 */
.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

/* 主题按钮 */
.btn-primary {
  background-color: var(--primary-color) !important;
  color: #ffffff !important;
  border-radius: 44rpx;
  font-weight: 600;
  font-size: 30rpx;
}

.btn-primary:active {
  opacity: 0.88;
}
`
  });

  // 5. app.js (Application lifecycle)
  files.push({
    path: 'app.js',
    name: 'app.js',
    type: 'js',
    description: '小程序入口逻辑，管理 App 启动生命周期、全局数据与微信登录会话',
    content: `// app.js
App({
  onLaunch(options) {
    console.log('${meta.appName} 启动成功', options);

    // 1. 展示微信本地版本检查
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已准备就绪，是否重启应用？',
              success(res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
        }
      });
    }

    // 2. 模拟静默微信登录与获取用户信息
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          console.log('获取微信登录凭证 code 成功:', res.code);
        }
      }
    });
  },

  // 全局共享响应式状态
  globalData: {
    userInfo: null,
    themeColor: '${meta.themeColor}',
    cart: [],
    version: '${meta.version}'
  }
});
`
  });

  // 6. Generate Page Files
  template.pages.forEach((page) => {
    // page.json
    files.push({
      path: `${page.path}.json`,
      name: `${page.id}.json`,
      type: 'json',
      description: `页面配置文件，指定页面导航栏标题 "${page.title}" 及下拉刷新等`,
      content: JSON.stringify(
        {
          navigationBarTitleText: page.title,
          enablePullDownRefresh: true,
          backgroundTextStyle: 'dark'
        },
        null,
        2
      )
    });

    // page.wxml
    files.push({
      path: `${page.path}.wxml`,
      name: `${page.id}.wxml`,
      type: 'wxml',
      description: `页面结构标记语言 (WXML)，使用微信原生组件 <view>、<text>、<image>`,
      content: generatePageWxml(template.id, page.id, meta)
    });

    // page.wxss
    files.push({
      path: `${page.path}.wxss`,
      name: `${page.id}.wxss`,
      type: 'wxss',
      description: `页面样式文件 (WXSS)，支持微信特有的 rpx 响应式视口单位`,
      content: generatePageWxss(template.id, page.id, meta)
    });

    // page.js
    files.push({
      path: `${page.path}.js`,
      name: `${page.id}.js`,
      type: 'js',
      description: `页面业务逻辑脚本，使用微信 Page({}) 构造器处理数据与交互事件`,
      content: generatePageJs(template.id, page.id, meta)
    });
  });

  return files;
}

function generatePageWxml(templateId: string, pageId: string, meta: MiniProgramMeta): string {
  if (templateId === 'depth_video') {
    if (pageId === 'index') {
      return `<!-- pages/index/index.wxml - 抖音/全网去水印下载与灰度深度视频生成 -->
<view class="container depth-container">
  <view class="hero-card card">
    <view class="hero-tag">Evil0ctal 去水印引擎 + Depth Anything V2</view>
    <text class="hero-title">抖音/全网视频无水印下载 & 灰度深度视频生成</text>
    <text class="hero-desc">支持复制抖音、B站、TikTok、小红书、快手链接一键去水印保存相册，或转为 H.264 灰度相对深度 MP4</text>
  </view>

  <!-- 方式 A：复制抖音/全网链接一键去水印 -->
  <view class="card input-card">
    <view class="section-header flex-between">
      <view class="flex-row">
        <text class="section-icon">✂️</text>
        <text class="section-title">方式 A：复制抖音链接一键去水印下载</text>
      </view>
      <button class="paste-btn" bindtap="pasteFromClipboard">读取剪贴板</button>
    </view>
    <textarea class="link-textarea" placeholder="长按粘贴抖音 App 复制的分享口令或 https://v.douyin.com/... 链接" value="{{douyinText}}" bindinput="onInputDouyinText" maxlength="500"></textarea>
    <view class="flex-between" style="gap: 16rpx; margin-top: 16rpx;">
      <button class="btn-primary parse-btn" loading="{{parsing}}" bindtap="handleParseCleanVideo">
        {{parsing ? '正在去水印解析...' : '✂️ 一键去水印提取原视频'}}
      </button>
      <button class="btn-secondary parse-btn" loading="{{submitting}}" bindtap="handleParseDouyin">
        {{submitting ? '正在转换...' : '🎬 转为深度视频'}}
      </button>
    </view>
    <text class="error-tip" wx:if="{{douyinError}}">{{douyinError}}</text>

    <!-- 去水印解析结果与直接保存相册 -->
    <view class="clean-result-box" wx:if="{{parsedVideo}}" style="margin-top: 20rpx; padding-top: 20rpx; border-top: 2rpx solid #E5E6EB;">
      <text class="section-title">{{parsedVideo.platformName}} · {{parsedVideo.title}}</text>
      <video class="main-video" src="{{parsedVideo.playUrl}}" controls="true" style="width: 100%; height: 360rpx; margin: 12rpx 0; border-radius: 12rpx;"></video>
      <button class="btn-primary" bindtap="saveCleanVideoToAlbum">⬇️ 保存无水印原画 MP4 到手机相册</button>
    </view>
  </view>

  <!-- 方式 B：上传本地视频转深度视频 -->
  <view class="card upload-card" bindtap="chooseLocalVideo">
    <view class="upload-inner flex-center">
      <text class="upload-icon">📹</text>
      <text class="upload-title">方式 B：上传本地相册视频转灰度深度 MP4</text>
      <text class="upload-sub">调用 wx.chooseMedia 选取手机本地 MP4 / MOV 视频 (Depth Anything V2 逐帧推理)</text>
    </view>
  </view>

  <!-- 规格参数确认 -->
  <view class="card config-card">
    <view class="config-title">开源引擎与算法标准：</view>
    <view class="config-list">
      <view class="config-item">✓ 去水印：Evil0ctal/Douyin_TikTok_Download_API (ABogus + Websign)</view>
      <view class="config-item">✓ 深度模型：Depth Anything V2 Small (全片统一 1st~99th 分位数归一化)</view>
      <view class="config-item">✓ 产物：无水印原画 MP4 & H.264 灰度深度 MP4 (近亮远暗)</view>
    </view>
  </view>
</view>`;
    }

    if (pageId === 'process') {
      return `<!-- pages/process/process.wxml - 真实任务处理与进度轮询 -->
<view class="container process-container">
  <view class="card progress-card flex-center">
    <view class="progress-ring">
      <text class="progress-percent">{{progress}}%</text>
    </view>
    <text class="progress-status">{{stageText}}</text>
    <text class="progress-frames" wx:if="{{totalFrames > 0}}">已处理: {{currentFrame}} / {{totalFrames}} 帧</text>
  </view>

  <view class="card details-card" wx:if="{{videoMeta}}">
    <view class="section-title">源视频信息</view>
    <view class="meta-row flex-between">
      <text class="label">分辨率</text>
      <text class="val">{{videoMeta.width}} × {{videoMeta.height}}</text>
    </view>
    <view class="meta-row flex-between">
      <text class="label">帧率 / 时长</text>
      <text class="val">{{videoMeta.fps}} FPS · {{videoMeta.duration}} 秒</text>
    </view>
  </view>

  <view class="error-box card" wx:if="{{jobError}}">
    <text class="error-title">处理异常失败：</text>
    <text class="error-msg">{{jobError}}</text>
    <button class="btn-retry" bindtap="retryJob">返回重试</button>
  </view>

  <button class="btn-primary" wx:if="{{isCompleted}}" bindtap="goToPlayer">查看生成的灰度深度 MP4</button>
</view>`;
    }

    if (pageId === 'player') {
      return `<!-- pages/player/player.wxml - 灰度深度视频播放与相册保存 -->
<view class="container player-container">
  <view class="video-card card">
    <view class="video-header flex-between">
      <text class="video-title">生成的灰度深度控制视频 (MP4)</text>
      <text class="video-tag">近亮远暗 · H.264</text>
    </view>
    <video id="depthPlayer" class="main-video" src="{{depthVideoUrl}}" controls="true" autoplay="true" loop="true"></video>
  </view>

  <!-- 保存与导出 -->
  <view class="action-card card">
    <button class="btn-primary btn-save" bindtap="saveToAlbum">
      保存灰度深度 MP4 到手机相册 (wx.saveVideoToPhotosAlbum)
    </button>
    <button class="btn-secondary" open-type="share">分享深度视频给微信好友</button>
  </view>
</view>`;
    }

    if (pageId === 'history') {
      return `<!-- pages/history/history.wxml - 历史任务记录 -->
<view class="container history-container">
  <view class="section-header flex-between">
    <text class="header-title">深度视频历史记录</text>
    <text class="clean-btn" bindtap="clearHistory">清空</text>
  </view>

  <block wx:for="{{historyList}}" wx:key="id">
    <view class="history-item card flex-between" data-id="{{item.id}}" bindtap="openHistory">
      <view>
        <text class="title">{{item.name}}</text>
        <text class="meta">{{item.time}} · {{item.frames}} 帧 · 灰度 H.264</text>
      </view>
      <text class="status-tag">已完成</text>
    </view>
  </block>
</view>`;
    }
  }

  if (templateId === 'dining') {
    if (pageId === 'index') {
      return `<!-- pages/index/index.wxml - 麦香轻食点餐首页 -->
<view class="container index-container">
  <!-- 微信原生轮播图组件 -->
  <swiper class="banner-swiper" indicator-dots="true" autoplay="true" interval="4000" circular="true" indicator-active-color="${meta.themeColor}">
    <block wx:for="{{banners}}" wx:key="id">
      <swiper-item>
        <view class="banner-card {{item.bgGradient}}">
          <view class="banner-tag">{{item.tag}}</view>
          <text class="banner-title">{{item.title}}</text>
          <text class="banner-subtitle">{{item.subtitle}}</text>
          <button class="banner-btn" bindtap="goToMenu">立即选购</button>
        </view>
      </swiper-item>
    </block>
  </swiper>

  <!-- 快捷服务网格 -->
  <view class="quick-nav card flex-between">
    <view class="nav-item flex-center" bindtap="goToMenu">
      <view class="nav-icon bg-green">🍱</view>
      <text class="nav-text">堂食点餐</text>
      <text class="nav-sub">扫码免排队</text>
    </view>
    <view class="nav-divider"></view>
    <view class="nav-item flex-center" bindtap="goToMenu">
      <view class="nav-icon bg-amber">🛵</view>
      <text class="nav-text">外卖配送</text>
      <text class="nav-sub">准时送达</text>
    </view>
  </view>

  <!-- 今日特惠推荐 -->
  <view class="section-title flex-between">
    <text class="title-bold">今日热卖精选</text>
    <text class="title-more" bindtap="goToMenu">全部菜单 ›</text>
  </view>

  <view class="dish-list">
    <block wx:for="{{recommendedDishes}}" wx:key="id">
      <view class="dish-card card flex-row">
        <view class="dish-emoji">{{item.image}}</view>
        <view class="dish-info">
          <text class="dish-name">{{item.name}}</text>
          <text class="dish-desc">{{item.desc}}</text>
          <view class="dish-bottom flex-between">
            <view class="price-wrap">
              <text class="price-symbol">¥</text>
              <text class="price-val">{{item.price}}</text>
              <text class="price-orig">¥{{item.originalPrice}}</text>
            </view>
            <button class="add-btn" data-item="{{item}}" bindtap="addToCart">加购物车</button>
          </view>
        </view>
      </view>
    </block>
  </view>
</view>`;
    }

    if (pageId === 'menu') {
      return `<!-- pages/menu/menu.wxml - 点餐菜单与加购 -->
<view class="menu-container">
  <!-- 左侧分类侧边栏 -->
  <scroll-view class="category-sidebar" scroll-y="true">
    <block wx:for="{{categories}}" wx:key="id">
      <view class="cat-item {{currentCat === item.id ? 'active' : ''}}" data-id="{{item.id}}" bindtap="selectCategory">
        <text>{{item.name}}</text>
      </view>
    </block>
  </scroll-view>

  <!-- 右侧菜品列表 -->
  <scroll-view class="dishes-content" scroll-y="true">
    <view class="cat-header">{{currentCatName}}</view>
    <block wx:for="{{filteredDishes}}" wx:key="id">
      <view class="dish-row flex-row">
        <view class="dish-avatar">{{item.image}}</view>
        <view class="dish-main">
          <text class="dish-title">{{item.name}}</text>
          <text class="dish-sales">月售 {{item.sales}} · 好评 {{item.rating}}</text>
          <view class="dish-action flex-between">
            <text class="dish-price">¥{{item.price}}</text>
            <view class="cart-control flex-row">
              <button class="ctrl-btn minus" wx:if="{{item.quantity > 0}}" data-item="{{item}}" bindtap="decreaseDish">-</button>
              <text class="ctrl-count" wx:if="{{item.quantity > 0}}">{{item.quantity}}</text>
              <button class="ctrl-btn plus" data-item="{{item}}" bindtap="increaseDish">+</button>
            </view>
          </view>
        </view>
      </view>
    </block>
  </scroll-view>

  <!-- 底部购物车结算浮条 -->
  <view class="cart-bar flex-between" wx:if="{{totalCount > 0}}">
    <view class="cart-left flex-row">
      <view class="cart-badge-wrap">
        <text class="cart-icon">🛒</text>
        <text class="cart-badge">{{totalCount}}</text>
      </view>
      <view class="cart-price">
        <text class="symbol">¥</text>
        <text class="total">{{totalAmount}}</text>
      </view>
    </view>
    <button class="checkout-btn" bindtap="handleCheckout">微信支付结算</button>
  </view>
</view>`;
    }
  }

  if (templateId === 'booking') {
    return `<!-- pages/${pageId}/${pageId}.wxml - 美学沙龙预约 -->
<view class="container booking-container">
  <view class="banner-card card">
    <text class="banner-badge">会员尊享</text>
    <text class="banner-title">专业芳疗与美学定制</text>
    <text class="banner-desc">精选国际认证持证芳疗师，尊享私密独立护肤包厢</text>
  </view>

  <view class="section-title">可预约定制项目</view>
  <view class="service-list">
    <block wx:for="{{services}}" wx:key="id">
      <view class="service-item card flex-between">
        <view class="service-meta">
          <text class="service-name">{{item.name}}</text>
          <text class="service-time">{{item.duration}} · {{item.specialist}}</text>
          <text class="service-price">¥{{item.price}}</text>
        </view>
        <button class="btn-book" data-service="{{item}}" bindtap="openBookingModal">立即预约</button>
      </view>
    </block>
  </view>
</view>`;
  }

  if (templateId === 'business') {
    return `<!-- pages/${pageId}/${pageId}.wxml - 科技企业官网与智能名片 -->
<view class="container business-container">
  <!-- 商务名片区域 -->
  <view class="card-hero card">
    <view class="flex-between">
      <view>
        <text class="name">{{cardInfo.name}}</text>
        <text class="title">{{cardInfo.title}}</text>
      </view>
      <view class="company-logo">创界</view>
    </view>
    <view class="contact-links">
      <view class="contact-item" bindtap="makePhoneCall">📞 电话：{{cardInfo.phone}}</view>
      <view class="contact-item">✉️ 邮箱：{{cardInfo.email}}</view>
      <view class="contact-item" bindtap="openLocation">📍 地址：{{cardInfo.address}}</view>
    </view>
    <view class="card-actions flex-between">
      <button class="btn-primary" bindtap="saveToPhoneContact">保存至手机通讯录</button>
      <button class="btn-share" open-type="share">分享名片</button>
    </view>
  </view>
</view>`;
  }

  if (templateId === 'habits') {
    return `<!-- pages/${pageId}/${pageId}.wxml - 微习惯打卡 -->
<view class="container habit-container">
  <view class="streak-header card flex-between">
    <view>
      <text class="streak-sub">连续自律坚持</text>
      <text class="streak-days">{{streakDays}} 天</text>
      <text class="streak-motto">坚持，让改变自然发生</text>
    </view>
    <view class="streak-badge">🔥</view>
  </view>

  <view class="section-title">今日打卡清单</view>
  <view class="habit-list">
    <block wx:for="{{habits}}" wx:key="id">
      <view class="habit-item card flex-between {{item.completed ? 'done' : ''}}" data-id="{{item.id}}" bindtap="toggleHabit">
        <view class="flex-row">
          <text class="habit-icon">{{item.icon}}</text>
          <view class="habit-text">
            <text class="habit-name">{{item.name}}</text>
            <text class="habit-streak">已坚持 {{item.streak}} 天</text>
          </view>
        </view>
        <view class="check-box {{item.completed ? 'checked' : ''}}"></view>
      </view>
    </block>
  </view>
</view>`;
  }

  // Generic fallback WXML
  return `<!-- pages/${pageId}/${pageId}.wxml -->
<view class="container">
  <view class="card header-card">
    <view class="title-box">
      <text class="title">${meta.appName}</text>
      <text class="badge">${pageId}</text>
    </view>
    <text class="desc">微信小程序原生页面示例，支持微信事件绑定、条件渲染与列表循环。</text>
  </view>

  <view class="card content-card">
    <view class="section-title">页面状态数据 (data)</view>
    <view class="data-preview">
      <text class="code-text">{{pageInfo}}</text>
    </view>
    <button class="btn-primary" bindtap="handleAction">点击触发交互 (wx.showToast)</button>
    <button class="btn-share" open-type="share">分享给微信好友</button>
  </view>
</view>`;
}

function generatePageWxss(templateId: string, pageId: string, meta: MiniProgramMeta): string {
  if (templateId === 'depth_video') {
    return `/* pages/${pageId}/${pageId}.wxss - ${meta.appName} */
.depth-container,
.process-container,
.player-container,
.history-container {
  padding: 24rpx;
}

.hero-card {
  background: linear-gradient(135deg, ${meta.themeColor}, #1E40AF);
  color: #ffffff;
}

.hero-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  margin-bottom: 12rpx;
}

.hero-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.hero-desc {
  display: block;
  font-size: 24rpx;
  opacity: 0.9;
  line-height: 1.5;
}

.section-header {
  margin-bottom: 16rpx;
}

.section-icon {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D2129;
}

.paste-btn {
  margin: 0;
  padding: 6rpx 20rpx;
  font-size: 22rpx;
  background: #EFF6FF;
  color: ${meta.themeColor};
  border-radius: 24rpx;
  line-height: 1.6;
}

.link-textarea {
  width: 100%;
  height: 140rpx;
  background: #F7F8FA;
  border: 2rpx solid #E5E6EB;
  border-radius: 12rpx;
  padding: 16rpx;
  box-sizing: border-box;
  font-size: 26rpx;
  color: #1D2129;
}

.parse-btn {
  flex: 1;
  margin-top: 16rpx;
  font-size: 26rpx;
}

.btn-secondary {
  background-color: #EEF2FF !important;
  color: ${meta.themeColor} !important;
  border-radius: 44rpx;
  font-weight: 600;
  font-size: 26rpx;
}

.error-tip {
  display: block;
  margin-top: 12rpx;
  color: #EF4444;
  font-size: 24rpx;
}

.upload-card {
  border: 2rpx dashed #93C5FD;
  background: #F8FAFC;
}

.upload-inner {
  flex-direction: column;
  padding: 28rpx 16rpx;
  text-align: center;
}

.upload-icon {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.upload-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1E293B;
  margin-bottom: 6rpx;
}

.upload-sub {
  font-size: 22rpx;
  color: #64748B;
}

.config-title {
  font-size: 26rpx;
  font-weight: bold;
  color: #1E293B;
  margin-bottom: 12rpx;
}

.config-item {
  font-size: 24rpx;
  color: #475569;
  line-height: 1.7;
}

.progress-card {
  flex-direction: column;
  padding: 48rpx 24rpx;
}

.progress-ring {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  border: 8rpx solid ${meta.themeColor};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.progress-percent {
  font-size: 36rpx;
  font-weight: bold;
  color: ${meta.themeColor};
}

.progress-status {
  font-size: 28rpx;
  font-weight: 600;
  color: #1E293B;
  text-align: center;
  margin-bottom: 8rpx;
}

.progress-frames {
  font-size: 24rpx;
  color: #64748B;
}

.meta-row {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F1F5F9;
  font-size: 26rpx;
}

.main-video {
  width: 100%;
  height: 420rpx;
  background: #000000;
  border-radius: 12rpx;
  margin-top: 16rpx;
}

.video-tag,
.status-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  background: #DCFCE7;
  color: #15803D;
}

.history-item .title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1E293B;
}

.history-item .meta {
  display: block;
  font-size: 22rpx;
  color: #64748B;
  margin-top: 6rpx;
}
`;
  }

  return `/* pages/${pageId}/${pageId}.wxss */
.index-container {
  padding: 24rpx;
}

.banner-swiper {
  width: 100%;
  height: 320rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.banner-card {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, ${meta.themeColor}, #059669);
  padding: 32rpx;
  box-sizing: border-box;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.banner-tag {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.25);
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  margin-bottom: 12rpx;
}

.banner-title {
  font-size: 34rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.banner-subtitle {
  font-size: 24rpx;
  opacity: 0.88;
  margin-bottom: 20rpx;
}

.banner-btn {
  align-self: flex-start;
  background: #ffffff;
  color: ${meta.themeColor};
  font-size: 24rpx;
  font-weight: 600;
  border-radius: 30rpx;
  padding: 8rpx 28rpx;
  margin: 0;
}

.quick-nav {
  padding: 28rpx 36rpx;
}

.nav-item {
  flex-direction: column;
}

.nav-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-bottom: 12rpx;
  background: #E8F5E9;
}

.nav-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #1F2937;
}

.nav-sub {
  font-size: 22rpx;
  color: #9CA3AF;
  margin-top: 4rpx;
}

.nav-divider {
  width: 2rpx;
  height: 60rpx;
  background: #E5E7EB;
}

.section-title {
  margin: 32rpx 4rpx 16rpx;
}

.title-bold {
  font-size: 32rpx;
  font-weight: bold;
  color: #111827;
}

.title-more {
  font-size: 26rpx;
  color: ${meta.themeColor};
}

.dish-card {
  margin-bottom: 20rpx;
}

.dish-emoji {
  font-size: 64rpx;
  width: 140rpx;
  height: 140rpx;
  background: #F3F4F6;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.dish-info {
  flex: 1;
}

.dish-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1F2937;
  display: block;
}

.dish-desc {
  font-size: 22rpx;
  color: #6B7280;
  margin-top: 6rpx;
  display: block;
}

.dish-bottom {
  margin-top: 16rpx;
}

.price-symbol {
  font-size: 24rpx;
  color: #EF4444;
  font-weight: bold;
}

.price-val {
  font-size: 34rpx;
  color: #EF4444;
  font-weight: bold;
  margin-right: 12rpx;
}

.price-orig {
  font-size: 22rpx;
  color: #9CA3AF;
  text-decoration: line-through;
}

.add-btn {
  background: ${meta.themeColor};
  color: #ffffff;
  font-size: 24rpx;
  border-radius: 30rpx;
  padding: 8rpx 24rpx;
  margin: 0;
}

/* 微信分享按钮通用样式 */
.btn-share {
  margin-top: 20rpx;
  background: #EBF7EE;
  color: ${meta.themeColor};
  border-radius: 40rpx;
  font-size: 28rpx;
}
`;
}

function generatePageJs(templateId: string, pageId: string, meta: MiniProgramMeta): string {
  if (templateId === 'depth_video') {
    if (pageId === 'index') {
      return `// pages/index/index.js - 抖音/全网去水印下载与深度视频转换
const app = getApp();
// 默认指向后端 API 服务地址 (部署时请在微信公众平台配置合法 request / uploadFile / downloadFile 域名)
const SERVER_URL = 'http://localhost:3000';

Page({
  data: {
    douyinText: '',
    parsing: false,
    submitting: false,
    douyinError: '',
    parsedVideo: null
  },

  onLoad() {
    wx.request({
      url: SERVER_URL + '/api/health',
      method: 'GET',
      success: (res) => {
        console.log('后端引擎状态:', res.data);
      }
    });
  },

  onInputDouyinText(e) {
    this.setData({
      douyinText: e.detail.value,
      douyinError: ''
    });
  },

  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({
            douyinText: res.data,
            douyinError: ''
          });
          wx.showToast({ title: '已读取剪贴板', icon: 'success' });
        }
      }
    });
  },

  // 方式 A1：一键去水印解析原视频 (Evil0ctal ABogus + Websign)
  handleParseCleanVideo() {
    const text = this.data.douyinText.trim();
    if (!text) {
      wx.showToast({ title: '请先粘贴抖音或视频链接', icon: 'none' });
      return;
    }

    this.setData({ parsing: true, douyinError: '' });
    wx.showLoading({ title: '正在去水印解析...' });

    wx.request({
      url: SERVER_URL + '/api/parse',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { shareText: text },
      success: (res) => {
        wx.hideLoading();
        this.setData({ parsing: false });
        if (res.data && res.data.success && res.data.data) {
          const info = res.data.data;
          info.playUrl = SERVER_URL + info.proxyPlayUrl;
          info.downloadUrl = SERVER_URL + info.proxyDownloadUrl;
          this.setData({ parsedVideo: info });
          wx.showToast({ title: '去水印解析成功', icon: 'success' });
        } else {
          this.setData({
            douyinError: (res.data && res.data.error) || '去水印解析失败'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        this.setData({
          parsing: false,
          douyinError: '无法连接后端去水印服务'
        });
      }
    });
  },

  // 保存去水印后的原画 MP4 到手机相册
  saveCleanVideoToAlbum() {
    if (!this.data.parsedVideo || !this.data.parsedVideo.downloadUrl) return;
    wx.showLoading({ title: '正在下载无水印视频...' });
    wx.downloadFile({
      url: this.data.parsedVideo.downloadUrl,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.tempFilePath) {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到手机相册', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '保存相册失败，请检查授权', icon: 'none' });
            }
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '下载失败', icon: 'none' });
      }
    });
  },

  // 方式 A2：提交抖音链接转为灰度深度视频
  handleParseDouyin() {
    const text = this.data.douyinText.trim();
    if (!text) {
      wx.showToast({ title: '请先粘贴抖音链接', icon: 'none' });
      return;
    }

    this.setData({ submitting: true, douyinError: '' });
    wx.showLoading({ title: '正在创建解析任务...' });

    wx.request({
      url: SERVER_URL + '/api/jobs/douyin',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { shareText: text, url: text },
      success: (res) => {
        wx.hideLoading();
        this.setData({ submitting: false });
        if (res.data && res.data.success && res.data.job) {
          const jobId = res.data.job.id;
          wx.setStorageSync('active_depth_job_id', jobId);
          const history = wx.getStorageSync('depth_jobs') || [];
          history.unshift(res.data.job);
          wx.setStorageSync('depth_jobs', history.slice(0, 30));

          wx.navigateTo({
            url: '/pages/process/process?jobId=' + jobId
          });
        } else {
          this.setData({
            douyinError: (res.data && res.data.error) || '解析失败，请检查链接有效性或改用上传本地视频'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        this.setData({
          submitting: false,
          douyinError: '无法连接后端服务，请确认服务已启动且已配置微信合法域名'
        });
      }
    });
  },

  // 方式 B：上传本地相册/文件视频
  chooseLocalVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success: (chooseRes) => {
        const file = chooseRes.tempFiles[0];
        if (!file) return;

        wx.showLoading({ title: '正在上传视频文件...' });
        wx.uploadFile({
          url: SERVER_URL + '/api/jobs/upload',
          filePath: file.tempFilePath,
          name: 'video',
          success: (uploadRes) => {
            wx.hideLoading();
            try {
              const data = JSON.parse(uploadRes.data);
              if (data.success && data.job) {
                const jobId = data.job.id;
                wx.setStorageSync('active_depth_job_id', jobId);
                const history = wx.getStorageSync('depth_jobs') || [];
                history.unshift(data.job);
                wx.setStorageSync('depth_jobs', history.slice(0, 30));

                wx.navigateTo({
                  url: '/pages/process/process?jobId=' + jobId
                });
              } else {
                wx.showModal({
                  title: '上传被拒绝',
                  content: data.error || '视频格式或时长校验失败',
                  showCancel: false
                });
              }
            } catch (e) {
              wx.showToast({ title: '服务响应异常', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showModal({
              title: '上传失败',
              content: '网络错误或文件超出限制，请检查后端状态',
              showCancel: false
            });
          }
        });
      }
    });
  }
});
`;
    }

    if (pageId === 'process') {
      return `// pages/process/process.js - 实时轮询真实任务进度
const SERVER_URL = 'http://localhost:3000';

Page({
  data: {
    jobId: '',
    status: 'queued',
    progress: 0,
    stageText: '排队等待中...',
    currentFrame: 0,
    totalFrames: 0,
    videoMeta: null,
    jobError: null,
    isCompleted: false
  },

  onLoad(options) {
    const jobId = (options && options.jobId) || wx.getStorageSync('active_depth_job_id');
    if (jobId) {
      this.setData({ jobId: jobId });
      this.pollJobStatus();
    }
  },

  onUnload() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  },

  pollJobStatus() {
    if (!this.data.jobId) return;

    wx.request({
      url: SERVER_URL + '/api/jobs/' + this.data.jobId,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success && res.data.job) {
          const job = res.data.job;
          const stageText = job.stageText || '正在处理中...';

          this.setData({
            status: job.status,
            progress: job.progress || 0,
            stageText: stageText,
            currentFrame: job.currentFrame || 0,
            totalFrames: job.totalFrames || 0,
            videoMeta: job.metadata || job.videoMeta || null,
            jobError: job.error || null,
            isCompleted: job.status === 'completed'
          });

          if (job.status === 'completed') {
            wx.setStorageSync('active_depth_job_id', this.data.jobId);
            wx.showToast({ title: '处理完成！', icon: 'success' });
            setTimeout(() => {
              this.goToPlayer();
            }, 800);
            return;
          }

          if (job.status === 'failed') {
            return;
          }

          this.pollTimer = setTimeout(() => {
            this.pollJobStatus();
          }, 1000);
        }
      },
      fail: () => {
        this.pollTimer = setTimeout(() => {
          this.pollJobStatus();
        }, 2000);
      }
    });
  },

  goToPlayer() {
    if (this.data.jobId) {
      wx.setStorageSync('active_depth_job_id', this.data.jobId);
    }
    wx.switchTab({
      url: '/pages/player/player'
    });
  },

  retryJob() {
    wx.navigateBack();
  }
});
`;
    }

    if (pageId === 'player') {
      return `// pages/player/player.js - 灰度深度 MP4 预览与下载
const SERVER_URL = 'http://localhost:3000';

Page({
  data: {
    jobId: '',
    depthVideoUrl: '',
    videoUrl: '',
    downloading: false
  },

  onLoad(options) {
    const jobId = (options && options.jobId) || wx.getStorageSync('active_depth_job_id');
    if (jobId) {
      this.updateVideoJob(jobId);
    }
  },

  onShow() {
    const jobId = wx.getStorageSync('active_depth_job_id');
    if (jobId && jobId !== this.data.jobId) {
      this.updateVideoJob(jobId);
    }
  },

  updateVideoJob(jobId) {
    const url = SERVER_URL + '/api/jobs/' + jobId + '/depth-video';
    this.setData({
      jobId: jobId,
      depthVideoUrl: url,
      videoUrl: url
    });
  },

  // 保存深度 MP4 到手机相册
  saveToAlbum() {
    if (!this.data.jobId) {
      wx.showToast({ title: '请先生成一个深度视频任务', icon: 'none' });
      return;
    }

    this.setData({ downloading: true });
    wx.showLoading({ title: '正在下载视频...' });

    const downloadUrl = SERVER_URL + '/api/jobs/' + this.data.jobId + '/download';

    wx.downloadFile({
      url: downloadUrl,
      success: (res) => {
        wx.hideLoading();
        this.setData({ downloading: false });
        if (res.statusCode === 200 && res.tempFilePath) {
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showModal({
                title: '保存成功',
                content: '灰度深度视频已存入手机相册，可直接导入 Seedance 或剪辑工具。',
                showCancel: false
              });
            },
            fail: () => {
              wx.showToast({ title: '相册授权被拒或失败', icon: 'none' });
            }
          });
        } else {
          wx.showToast({ title: '下载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ downloading: false });
        wx.showToast({ title: '网络连接失败', icon: 'none' });
      }
    });
  },

  copyDownloadUrl() {
    if (!this.data.jobId) return;
    const downloadUrl = SERVER_URL + '/api/jobs/' + this.data.jobId + '/download';
    wx.setClipboardData({
      data: downloadUrl,
      success: () => {
        wx.showToast({ title: '已复制下载直链', icon: 'success' });
      }
    });
  }
});
`;
    }

    if (pageId === 'history') {
      return `// pages/history/history.js - 本地任务历史
Page({
  data: {
    historyList: [],
    jobList: []
  },

  onShow() {
    const rawHistory = wx.getStorageSync('depth_jobs') || [];
    const formatted = rawHistory.map((item) => ({
      id: item.id,
      name: item.sourceName || item.name || '深度视频任务',
      frames: item.totalFrames || item.frames || 0,
      time: item.time || new Date(item.createdAt || Date.now()).toLocaleTimeString()
    }));
    this.setData({
      historyList: formatted,
      jobList: formatted
    });
  },

  openHistory(e) {
    const jobId = e.currentTarget.dataset.id;
    if (jobId) {
      wx.setStorageSync('active_depth_job_id', jobId);
      wx.switchTab({
        url: '/pages/player/player'
      });
    }
  },

  openJob(e) {
    this.openHistory(e);
  },

  clearHistory() {
    wx.removeStorageSync('depth_jobs');
    this.setData({ historyList: [], jobList: [] });
    wx.showToast({ title: '历史记录已清空', icon: 'none' });
  }
});
`;
    }
  }

  return `// pages/${pageId}/${pageId}.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    pageTitle: '${meta.appName}',
    themeColor: '${meta.themeColor}',
    loading: false,
    pageInfo: '页面加载成功，已成功绑定微信环境'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[${pageId}] 页面初始化，参数:', options);
    wx.setNavigationBarTitle({
      title: '${meta.appName}'
    });
  },

  /**
   * 页面交互响应
   */
  handleAction() {
    wx.showToast({
      title: '操作成功',
      icon: 'success',
      duration: 1800
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('触发下拉刷新');
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: '刷新完成', icon: 'none' });
    }, 800);
  },

  /**
   * 用户点击右上角分享给微信好友
   */
  onShareAppMessage() {
    return {
      title: '${meta.appName} - 欢迎体验',
      path: '/pages/${pageId}/${pageId}'
    };
  },

  /**
   * 用户点击分享到朋友圈
   */
  onShareTimeline() {
    return {
      title: '${meta.appName}',
      query: 'from=timeline'
    };
  }
});
`;
}
