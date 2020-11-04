export default class TaskEngine {
  constructor({ tasks, handlers, checkers }) {
    console.log('engine construct');
    this.tasks = tasks;
    this.handlers = handlers || [];
    this.checkers = checkers || [];
    this.currentT = 0;
    this.finished = false;
  }
  add(target, task, checker) {
    console.log('engine init');
    this.handlers.push(task.bind(target));
    this.checkers.push(checker.bind(target));
  }

  // next() {
  //   const isDone = this.checkers[this.currentT]();
  //   if (isDone) {
  //     // Proceed to next task or done
  //     this.onTaskCompleted();
  //   }
  // }
    // 任务流程处理逻辑
  _isActiveTask(idx) {
    for (let i = 0; i < idx; i++) {
      if (this.tasks[i].status != 'done') {
        my.alert({
          title: 'warning',
          content: '请按顺序依次完成任务'
        });
        return false
      };
    }
    if ((this.tasks[idx].status === 'done') && (idx != 3)) {
      my.alert({
        title: 'warning',
        content: '该任务已经完成'
      });
      return false;
    }
    return true;
  }
  _isAllFinished() {
    return this.tasks.reduce((isFinished, task) => {
      return isFinished && (task.status === 'done');
    }, true)
  }

  getTaskHandler(tid) {
    return this.tasks.map((_, idx) => (() => {
      if (this._isActiveTask(idx)) {
        this[this.handlers[idx]]();
      }
    }))[tid]
  }

  taskChecker() {
    if (this._isAllFinished()) {
      return;
    }
    let pendingT = 0;
    let tasks = this.tasks;
    for (let i = 0; i < tasks.length; i++) {
      if (tasks[i].status === 'done') continue;
      pendingT = i;
      break;
    }
    if (this.checkIfTaskCompleted(pendingT)) {
      app.$event.emit('TASK_COMPLETE', pendingT)
    } else {
      console.log('[taskChecker] failed ', pendingT)
    }
  }

  checkIfTaskCompleted(idx) {
    const isDone = this[this.checkers[idx]]();
    console.log('[checkIfTaskCompleted] - idx isDone: ', idx, isDone);
    return isDone;
  }

  onTaskCompleted(tid) {
    console.log('[onTaskCompleted]', tid);
    const tasks = this.tasks;
    tasks[tid].status = 'done';

    if (tid < tasks.length - 1) {
      tasks[tid + 1].status = 'working'
    }
    this._setData(tasks).then(() => {
      if (tid == 2) {
        // Pause checker
      } else if (tid === 3) {
        my.alert({
          title: '任务完成',
          content: '恭喜您已经完成所有任务'
        })
      } else {
        !my.isIDE && this.taskChecker()
      }
    })
  }
}