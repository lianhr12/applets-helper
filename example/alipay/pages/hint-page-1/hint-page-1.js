import DataConnector from '../../assets/js/data-util';

const app = getApp();
let conn = null;

Page({
  data: {
      user: null,
      isSet: false
  },

  onLoad() {
    conn = new DataConnector(app, this);
  },

  onShow() {
    if (!this.data.user) {
      conn.getData()
      .then(tasks => {
        if (tasks && tasks[0] && tasks[0].user) {
          this.setData({ user: tasks[0].user });
        } else {
          // Error
        }
      });
    }
  },

  taskAuth() {
    if (!this.data.isSet) {
      app.readDataFromLocal().then(data => {
        let tasks = data;
        tasks[0].isSet = true;
        app.writeDataToLocal(tasks);
        this.setData({
          isSet: true
        }, () => {
          my.navigateBack();
        })
      })
    }
  },

  disabledAlert() {
    my.alert({
      content: '请先登陆'
    })
  }
})