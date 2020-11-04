import DataConnector from '../../assets/js/data-util';

const app = getApp();
let conn = null;
Page({
  data: {
    tasks: null
  },

  onLoad() {
    conn = new DataConnector(app, this);
    this.loadData();
  },

  complete() {
    my.navigateBack();
  },

  loadData() {
    conn.getData(true).then(() => {
      const tasks = this.data.tasks;
      let date = this.data.tasks[3] && this.data.tasks[3].date;
      if (!date) {
        // 生成并存储用户完成日期
        const curDate = new Date();
        date = `${curDate.getFullYear()}-${curDate.getMonth() + 1}-${curDate.getDate()}`;
        tasks[3].date = date;
      }
      this.setData({ tasks });
      app.uploadData(tasks);
    });
  }
});
