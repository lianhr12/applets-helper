import DataConnector, { setLocal, getLocal } from '../../assets/js/data-util';

// 获取全局 app 实例
const app = getApp();
// 数据管理器
let conn = null;

Page({
  // 声明页面数据
  data: {
    dataLoaded: false,
    tasks: [],
    taskHandlers: [],
    taskCheckers: []
  },

  // 监听生命周期回调 onLoad
  onLoad() {
    // 初始化数据管理器
    conn = new DataConnector(app, this);
    // 添加事件回调 
    app.$event.on('READY', () => {
      this.setData({
        dataLoaded: true
      });
      this.bindTaskHandlers().then(() => {
        app.$event.on('TASK_CAN_CHECK', this.taskChecker.bind(this));
        app.$event.on('TASK_DONE', this.onTaskCompleted.bind(this));
      }).catch(_ => {
        // console.log('handlers set done');
      });
    });
  },
  // 监听生命周期回调 onShow
  onShow() {
    // 同步全局数据到本地
    this.loadData();
  },

  onHide() {
    // TODO: 清理注册事件
  },

  loadData() {
    if (!this.data.dataLoaded) {
      setTimeout(() => {
        this.loadData();
      }, 200);
      return;
    }
    conn.getData(true)
    .then(_ => {
      app.$event.emit('READY');
      if (!this.data.tasks[0].user) {
        return app.getUserInfo().then(user => {
          const tasks = this.data.tasks;
          tasks[0].user = user;
          return conn.setData(tasks);
        });
      } else {
        return this.data.tasks;
      }
    })
    .then(() => {
      // 触发任务检查逻辑
      setTimeout(() => {
        app.$event.emit('TASK_CAN_CHECK')
      }, 500)
    });
    
  },

  // 任务流入口
  onTaskClicked(e) {
    try {
      const tid = e.target.dataset.taskId;
      this.getTaskHandler(tid)();
    } catch(err) {
      console.error(err);
    }
  },

  // 任务流程处理逻辑
  bindTaskHandlers() {
    if (this.data.taskHandlers && (this.data.taskHandlers.length === 4)) {
      return Promise.reject();
    }
    const taskHandlers = [];
    const taskCheckers = [];
    taskHandlers.push(this.taskAuth.bind(this), this.taskSwip.bind(this), this.taskPreview.bind(this), this.taskCert.bind(this));
    taskCheckers.push(this.checkAuthTask.bind(this), this.checkSwipTask.bind(this), this.checkPreviewTask.bind(this), this.checkCertTask.bind(this));
    return new Promise((resolve) => {
      this.setData({
        taskHandlers, taskCheckers
      }, () => {
        return resolve();
      });
    });
  },
  _isActiveTask(idx) {
    for (let i = 0; i < idx; i++) {
      if (this.data.tasks[i].status != 'done') {
        my.alert({
          content: '请按顺序依次完成任务'
        });
        return false
      };
    }
    return true;
  },
  _isAllFinished() {
    return this.data.tasks.reduce((isFinished, task) => {
      return isFinished && (task.status === 'done');
    }, true)
  },

  getTaskHandler(tid) {
    return this.data.tasks.map((_, idx) => (() => {
      if (this._isActiveTask(idx)) {
        this.data.taskHandlers[idx]();
      }
    }))[tid]
  },

  taskChecker(tid) {
    if (this._isAllFinished()) {
      return;
    }
    let pendingT = 0;
    if (tid != undefined) {
      pendingT = tid;
    } else {
      let tasks = this.data.tasks;
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].status === 'done') continue;
        pendingT = i;
        break;
      }
    }
    if (this.checkIfTaskCompleted(pendingT)) {
      app.$event.emit('TASK_DONE', pendingT);
    } else {
      console.log('[taskChecker] failed ', pendingT)
    }
  },

  checkIfTaskCompleted(idx) {
    const isDone = this.data.taskCheckers[idx]();
    console.log(`[checkIfTaskCompleted] Current task ${idx} is ${isDone ? 'done' : 'pending'}`);
    return isDone;
  },

  onTaskCompleted(tid, meta) {
    const tasks = this.data.tasks;
    tasks[tid].status = 'done';
    tasks[tid].meta = meta;

    if (tid < tasks.length - 1) {
      tasks[tid + 1].status = 'working'
    }

    conn.setData(tasks).then(() => {
      if (tid === 2 || tid === 3) {
        // Pause checker
      } else {
        !my.isIDE && this.taskChecker()
      }
    })
  },

  // 任务定义和任务检查功能定义
  taskAuth() {
    my.navigateTo({
      url: '../hint-page-1/hint-page-1'
    });
    return;
  },
  checkAuthTask() {
    return !my.isIDE || !!this.data.tasks[0].isSet;
  },
  taskSwip() {
    my.navigateTo({
      url: '../hint-page-2/hint-page-2'
    });
  },
  checkSwipTask() {
    return !my.isIDE || this.data.tasks[1].isSet;
  },
  taskPreview() {
    my.navigateTo({
      url: '../hint-page-3/hint-page-3'
    });
  },
  checkPreviewTask() {
    return !my.isIDE;
  },
  taskCert() {
    my.navigateTo({
      url: '../cert-page/cert-page'
    });
  },
  checkCertTask() {
    // TODO: Set a flag for this task
    return true;
  }
});
