// app.ts - Vicoo Mini Program Entry

App({
  globalData: {
    apiBase: 'http://localhost:8000',
    userInfo: null,
    token: null
  },
  onLaunch() {
    // Check login status
    const token = wx.getStorageSync('vicoo_token');
    if (token) {
      this.globalData.token = token;
    }
    
    // Check system info for safe area
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
  },
  onShow() {
    console.log('Vicoo Mini Program Started');
  }
})
