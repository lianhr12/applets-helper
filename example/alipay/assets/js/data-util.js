export default class DataConnector {
  constructor(app, page) {
    this.app = app;
    this.page = page;
  }
  setData(tasks) {
    return new Promise((resolve) => {
      this.page.setData({ tasks }, () => {
        resolve(this.app.writeData(tasks));
      })
    })
  }
  
  getData(onlyLocal) {
    if (onlyLocal) {
      return this.app.readDataFromLocal()
      .then(data => {
        return new Promise((resolve) => {
          this.page.setData({ tasks: data }, () => resolve(data));
        });
      })
    }

    return this.app.readData().then(data =>
      new Promise((resolve) => {
        this.page.setData({ tasks: data }, () => resolve(data));
      })
    )
  }
}

export const setLocal = (key, val) => {
  if (typeof key != 'string' || typeof val != 'string') {
    return Promise.reject();
  }
  return new Promise((resolve, reject) => {
    my.setStorage({
      key,
      data: val,
      success: function() {
        return resolve();
      },
      fail: () => {
        // save data failed
        reject();
      }
    });
  });
}

export const getLocal = key => {
  if (typeof key != 'string') {
    return Promise.reject();
  }
  return new Promise((resolve, reject) => {
    my.getStorage({
      key,
      success: (result) => {
        if (result && result.data) {
          return resolve(result.data);
        }
        return resolve(null);
      },
      fail: () => {
        resolve(null);
      }
    });
  })
  
}