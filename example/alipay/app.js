const myPlugin = requirePlugin('myPlugin');
import PubSub from './assets/js/event.js';

App({
  tasks: [
    { text: '登录并获取会员信息', templateName: 'userInfo', status: 'working', user: null },
    { text: '让轮播组件动起来', templateName: '', status: 'pending', isSet: false },
    { text: '在手机中预览效果', templateName: '', status: 'pending' },
    { text: '手机端领取开发体验证书', templateName: '', status: 'pending', date: null }
  ],

  onLaunch() {
    this.readData().then(() => {
      this.$event.emit('READY');
    });
  },

  $event: new PubSub(),

  loadTaskRecord() {
    if (myPlugin) {
      return myPlugin.getData().then(res => {
        return res; // return {}; Debug
      }).catch(err => {
        console.error('catch err', err);
      });
    } else {
      return Promise.resolve(null);
    }
  },

  getUserInfo() {
    return new Promise((resolve, reject) => {
      my.getAuthCode({
        scopes: ['auth_base'],
        success: authcode => {
          console.info(authcode);
          my.getAuthUserInfo({
            success: res => {
              this.userInfo = res;
              resolve(this.userInfo);
              console.log('native user info: ', this.userInfo);
            },
            fail: () => {
              console.log('getu user info failed');
              resolve(null);
            }
          });
        },
        fail: () => {
          my.alert({
            title: '启动失败',
            content: '请关联小程序，并刷新重试'
          });
          reject(null);
        }
      });
    })
  },

  markTasksWithUserInfo(userInfo) {
    // userInfo + this.tasks -> this.tasks -> localStorage
    if (!userInfo || !userInfo.nick) {
      return;
    }

    this.tasks[0].user = {
      nickName: userInfo.nick,
      avatar: userInfo.avatar
    };
    if (userInfo.completed) {
      this.tasks[0].isSet = true;
      this.tasks[1].isSet = true;
      this.tasks[3].date = userInfo.ctime;
      this.tasks.forEach(t => {
        t.status = 'done';
      });
    }

    this.writeDataToLocal(this.tasks);
    return this.tasks;
  },

  readData() {
    // Data preparation
    // The source of truth
    // localStorage + remote userInfo -> this.tasks -> localStorage
    return Promise.all([this.loadTaskRecord(), this.readDataFromLocal()])
    .then(([userInfo, _]) => {
      if (userInfo) {
        this.markTasksWithUserInfo(userInfo);
        return this.tasks;
      }
      return this.tasks;
    })
    .catch(err => {
      console.error('[app] readData error - ', err);
    })
  },

  uploadData(tasks) {
    if (tasks && tasks[0].user && tasks[3].date) {
      myPlugin && myPlugin.setData(tasks[0].user);
    }
  },

  writeData(tasks) {
    // Task data updated
    return this.writeDataToLocal(tasks);
  },

  readDataFromLocal() {
    return this._readDataFromLocal()
    .then(tasks => {
      if (tasks) {
        this.tasks = tasks;
        return tasks;
      } else {
        return this._writeDataToLocal(this.tasks);
      }
    });
  },

  writeDataToLocal(data) {
    this.tasks = data;
    return this._writeDataToLocal(data);
  },
  // Note: Local data including data in app and localStorage
  _writeDataToLocal(data) {
    return new Promise((resolve, reject) => {
      my.setStorage({
        key: 'progData',
        data,
        success: function() {
          return resolve(data);
        },
        fail: () => {
          // save data failed
          reject({});
        }
      });
    });
  },
  _readDataFromLocal() {
    return new Promise((resolve, reject) => {
      my.getStorage({
        key: 'progData',
        success: (result) => {
          return resolve(result.data);
        },
        fail: () => {
          reject({});
        }
      });
    })
  },
});
