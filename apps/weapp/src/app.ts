// app.ts - Vicoo Mini Program Entry
App<IAppOption>({
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
  },
  onShow() {
    console.log('Vicoo Mini Program Started');
  }
})
