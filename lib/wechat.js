const fs = require('fs-extra');
const path = require('path');
const ci = require('miniprogram-ci');
const {isFunction} = require('lodash');

const {getGitCommit, getGitHash, getAppConfigs} = require('../utils/base');
const {sendImgMsg, sendMarkdownMsg} = require('../utils/wecom');
const {sendAppBuildInfo} = require('../utils/mail');

let configs = {
    "type" : "miniProgram",
    "ignores": ["node_modules/**/*"]
};

// 应用平台名称
const PLATFORM = 'Wechat';

// 处理微信小程序上传及预览
// 1、编译预览
//  1.1 上传后，获取二维码文件
//  1.2 图片保存到本地
//  1.3 邮件及企业微信通知
// 2、编译上传
//  2.1 获取sourcemap文件
//  2.2 获取固定体验版二维码图片
//  2.3 邮件及企业微信通知

module.exports = async(options) => {
    let {cwdPath, oValue} = options;

    if (!oValue) {
        throw Error('小程序指定处理命令不允许为空！');
    }
    
    const projectPath  = cwdPath;
    const config = getAppConfigs(projectPath, 'wechat');
    if (!config) {
        throw Error('当前目录根下无applets.local.json配置文件！');
    }

    try {
        const {version, name, appId:appid, privateKeyPath} = config;

        const tempDirPath = path.resolve(projectPath, './temp');
        await fs.ensureDir(tempDirPath);

        let _privateKeyPath = '';
        // 判断传入私钥路径是否为绝对路径
        if (path.isAbsolute(privateKeyPath)) {
            _privateKeyPath = privateKeyPath;
        }else {
            // 如果不是绝对路径，拼接相对路径
            _privateKeyPath = path.resolve(projectPath, `./${privateKeyPath}`);
        }
        const appConfigs = Object.assign(configs, {
            appid,
            projectPath,
            privateKeyPath: _privateKeyPath
        });

        // Git 提交信息
        const commits = await getGitCommit(projectPath);
        // 通知相关信息
        let noticeData = {
            name: name,
            version: version,
            gitHash: getGitHash(),
            gitCommit: commits,
            platform: PLATFORM
        };

        const project = new ci.Project(appConfigs);
        const stageMapping = {
            // 预览版本
            preview: async() => {
                const previewQrcodePath = path.resolve(tempDirPath, './preview-wechat.jpg');
                await appPreview(project, Object.assign({ 
                    previewQrcodePath
                }, noticeData));
            },
            // 上传版本
            upload: async() => {
                const uploadQrcodePath = path.resolve(tempDirPath, './upload-wechat.jpg');
                await appUpload(project, Object.assign({ 
                    tempDirPath,
                    uploadQrcodePath
                }, noticeData));
            }
        }
        isFunction(stageMapping[oValue]) && stageMapping[oValue]();
    }catch(e) {
        console.error(`编译失败，具体原因${e}`);
    }
};

// 小程序预览
async function appPreview(project, info={}) {
    const {previewQrcodePath, name, version, gitHash, gitCommit, platform} = info;
    const previewResult = await ci.preview({
        project,
        desc: gitCommit,
        qrcodeFormat: 'image',
        qrcodeOutputDest: previewQrcodePath,
        onProgressUpdate: console.log,
        // pagePath: 'pages/index/index', // 预览页面
        // searchQuery: 'a=1&b=2',  // 预览参数 [注意!]这里的`&`字符在命令行中应写成转义字符`\&`
        // scene: 1011, // 场景值, see: https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html
    });
    console.log(previewResult);
    await notificationAppInfo({
        name,
        version,
        platform,
        gitHash,
        gitCommit,
        devName: '预览版',
        filePath: previewQrcodePath
    });
}

// 小程序上传
async function appUpload(project, info={}) {
    const {version, tempDirPath, gitHash, gitCommit, uploadQrcodePath} = info;
    const uploadResult = await ci.upload({
        project,
        desc: gitCommit,
        version, // 版本号处理
        onProgressUpdate: console.log,
    });

    if (uploadResult && uploadResult.subPackageInfo.length > 0) {
        const savePath = path.resolve(tempDirPath, `./sourcemaps.zip`);
        // 获取sourcemap文件
        await getAppLatestSourcemapFile(project, {
            gitHash,
            savePath
        });

        // 通知用户
        await notificationAppInfo(Object.assign({
            filePath: uploadQrcodePath,
            devName: '体验版'
        }, info));
    }
}

// 获取小程序最新上传的sourcemap文件
async function getAppLatestSourcemapFile(project, info) {
    let {savePath} = info;
    try {
        const result = await ci.getDevSourceMap({
            project,
            robot: 1,
            sourceMapSavePath: savePath
        });
    }catch(e) {
        console.error(`获取sourcemap文件失败`);
        console.error(e);
    }
}

// 通知小程序信息
async function notificationAppInfo(info={}) {
    const { 
        filePath, 
        version, 
        gitHash, 
        name, 
        devName, 
        gitCommit,
        platform } = info;

    // 二维码图片不存在，不处理
    if(!fs.existsSync(filePath)){
        console.error(`二维码文件不存在！`);
        return ;
    }

    let result = await sendImgMsg({filePath});
    if (result && result.errcode === 0) {
        await sendMarkdownMsg({
            name,
            devName: devName,
            version,
            gitHash,
            gitCommit,
            platform
        });
    }
    // 发送邮件通知
    await sendAppBuildInfo(Object.assign({
        qcodePath: filePath
    }, info));
}