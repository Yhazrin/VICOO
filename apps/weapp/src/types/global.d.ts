// Global type declarations for WeChat Mini Program

interface AppOptions {
  globalData?: any;
  onLaunch?: () => void;
  onShow?: () => void;
}

interface PageOptions {
  data?: any;
  onLoad?: (options?: any) => void;
  onShow?: () => void;
  onReady?: () => void;
  onHide?: () => void;
  onUnload?: () => void;
  onShareAppMessage?: () => any;
  [key: string]: any;
}

declare var App: (options: AppOptions) => void;
declare var Page: (options: PageOptions) => void;
declare var Component: (options: any) => void;

declare namespace wx {
  function navigateTo(options: { url: string }): any;
  function navigateBack(options?: { delta?: number }): any;
  function switchTab(options: { url: string }): any;
  function showToast(options: { title: string; icon?: string }): any;
  function showModal(options: { title: string; content: string; success?: (res: any) => void }): any;
  function setStorageSync(key: string, value: any): void;
  function getStorageSync(key: string): any;
  function getSystemInfoSync(): { screenWidth: number; screenHeight: number };
  function setClipboardData(options: { data: string; success?: () => void }): any;
  function pageScrollTo(options: { scrollTop: number; duration?: number }): any;
  
  const request: (options: any) => any;
}
