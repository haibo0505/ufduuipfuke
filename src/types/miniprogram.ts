export type TemplateId = 'depth_video' | 'dining' | 'booking' | 'business' | 'habits';

export interface MiniProgramMeta {
  appName: string;
  appId: string;
  version: string;
  themeColor: string;
  themeBg: string;
  author: string;
  description: string;
  apiBaseUrl?: string;
}

export interface TabBarItem {
  pagePath: string;
  text: string;
  iconName: string;
  badge?: number | string;
}

export interface MiniProgramFile {
  path: string;
  name: string;
  type: 'json' | 'wxml' | 'wxss' | 'js';
  content: string;
  description: string;
}

export interface MiniProgramTemplate {
  id: TemplateId;
  name: string;
  tagline: string;
  category: string;
  themeColor: string;
  icon: string;
  description: string;
  defaultAppId: string;
  pages: {
    id: string;
    name: string;
    path: string;
    title: string;
  }[];
  tabBar: TabBarItem[];
  // Initial state for simulator
  simulatorData: any;
}
