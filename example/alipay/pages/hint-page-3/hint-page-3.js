Page({
  data: {
    isIDE: true
  },

  onShow() {
    this.setData({
      isIDE: my.isIDE
    })
  },

  complete() {
    my.navigateBack();
  },
})