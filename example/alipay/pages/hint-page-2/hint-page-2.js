const app = getApp();

Page({
  data: {
    isSet: false,
    background: ['blue', 'red', 'yellow'],
    indicatorDots: true,
    autoplay: false,
    vertical: false,
    interval: 500,
    circular: true,
  },

  onShow() {
    this.setData({
      // autoplay: true
    });
  },

  onChangeHandler() {
    if (!this.data.isSet) {
      app.readDataFromLocal().then(data => {
        let tasks = data;
        tasks[1].isSet = true;
        app.writeDataToLocal(tasks);
        this.setData({
          isSet: true
        })
      })
    }
  },
  next() {
    this.data.isSet && my.navigateBack();
  }
})