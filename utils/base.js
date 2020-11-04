const fs     = require('fs-extra');
const crypto = require('crypto');
const path   = require('path');
const execa  = require('execa');
const { gitlogPromise } = require("gitlog");

// 字符串生成md5
exports.md5 = (str) => {
    const md5 = crypto.createHash('md5');
    return md5.update(str).digest('hex');
};

// 获取当前git的hash版本号
exports.getGitHash = () => {
    const res = execa.commandSync('git rev-parse --short HEAD');
    return res.stdout;
};

// 获取当前分支名称
exports.getGitBranch = () => {
    const res = execa.commandSync('git rev-parse --abbrev-ref HEAD');
    return res.stdout;
};

// 获取Git提交记录
exports.getGitCommit = async (dirPath) => {
    // Git 提交信息
    const gitLogsOptions = {
        repo: dirPath,
        number: 3,
        fields: ["abbrevHash", "subject", "authorName"],
        execOptions: { maxBuffer: 1000 * 1024 },
    };
    const aCommits = await gitlogPromise(gitLogsOptions);
    let  commits   = aCommits.map((aItem) => {
        return `${aItem.subject}(${aItem.abbrevHash}) - ${aItem.authorName}`;
    });
    return commits;
};

// 获取配置信息
exports.getAppConfigs = (cwdPath, confType) => {
    let curConf = null;
    if (!confType) {
        return curConf;
    }

    let {applications} = require('../config.global');
    let cwdConfPath = path.resolve(cwdPath, './applets.local.json');
    if (!fs.existsSync(cwdConfPath)) {
        return curConf;
    }

    try {
        let cwdConf = require(cwdConfPath);
        // 指定覆盖的对象必须为默认配置文件的字段
        let curConf = applications[confType];
        if (curConf) {
            curConf = Object.assign(curConf, cwdConf);
        }
        return curConf;
    }catch(e) {
        console.log('获取本地配置文件失败！', e.stack);
        return curConf;
    }
};