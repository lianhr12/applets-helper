const fs = require('fs-extra');
const path = require('path');
const alipaydev = require('alipay-dev');
const {isFunction} = require('lodash');
const request = require('request-promise-native');

const {getGitCommit, getGitHash, getAppConfigs} = require('../utils/base');
const {sendImgMsg, sendMarkdownMsg} = require('../utils/wecom');
const {sendAppBuildInfo} = require('../utils/mail');


// 应用平台名称
const PLATFORM = 'Alipay';


// 处理支付宝小程序上传及预览
// 1、编译预览
//  1.1 上传后，获取二维码文件
//  1.2 图片转换base64格式
//  1.3 将图片发送具体渠道通知
// 2、编译上传
//  2.1 获取sourcemap文件
//  2.2 根据上传结果获取具体图片文件
//  2.3 将图片发送具体渠道通知

module.exports = async(options) => {
    let {cwdPath, oValue} = options;

    if (!oValue) {
        throw Error('小程序指定处理命令不允许为空！');
    }

    const projectPath  = cwdPath;
    // 依赖工具ID和私钥、appid、项目路径
    const config = getAppConfigs(projectPath, 'alipay');
    if (!config) {
        throw Error('当前目录根下无applets.local.json配置文件！');
    }

    const {
        appId:appid, 
        toolId, 
        privateKey,
        version,
        name
    } = config;
    // 校验参数

    try {
        alipaydev.setConfig({
            toolId,
            privateKey
        });
        const tempDirPath  = path.resolve(projectPath, './temp');
        await fs.ensureDir(tempDirPath);

        const appConfigs = {
            project: projectPath, // 项目目录路径
            appId: appid, // appId
        };

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

        const stageMapping = {
            // 预览版本
            preview: async() => {
                const qrcodeOutput = path.resolve(tempDirPath, `./preview-${PLATFORM}.jpg`);
                await appPreview(Object.assign({ 
                    qrcodeOutput
                }, appConfigs, noticeData));
            },
            // 上传版本
            upload: async() => {
                const qrcodeOutput = path.resolve(tempDirPath, `./upload-${PLATFORM}.jpg`);
                await appUpload(Object.assign({ 
                    tempDirPath,
                    qrcodeOutput
                }, appConfigs, noticeData));
            }
        }
        isFunction(stageMapping[oValue]) && stageMapping[oValue]();
    }catch(e) {
        console.error(`编译失败，具体原因${e}`);
    }
};

// 小程序预览
async function appPreview(info={}) {
    const {project, appId, qrcodeOutput} = info;

    const previewResult = await alipaydev.miniPreview({
        project,
        appId,
        qrcodeOutput,
    });
    console.log(previewResult);
    await notificationAppInfo(Object.assign({
        filePath: qrcodeOutput,
        devName: '预览版'
    }, info));
}


// 小程序上传，体验版
async function appUpload(info={}) {
    const {project, appId, version, qrcodeOutput} = info;
    const uploadResult = await alipaydev.miniUpload({
        project,
        appId,
        packageVersion: version,
        experience: true, // 上传成功后，自动设置为体验版本
        onProgressUpdate (info) {
            const { status, data } = info;
            console.log(status, data)
        }
    });

    console.log(uploadResult);
    // 获取体验图片，通过上面上传结果的二维码地址下载保存
    let {qrCodeUrl} = uploadResult;
    if (qrCodeUrl) {
        await downloadQrCodeImg(qrCodeUrl, qrcodeOutput);
    }

    // 获取sourcemap文件
    // TODO 官方暂时不支持，需要更新后跟进处理
    await notificationAppInfo(Object.assign({
        filePath: qrcodeOutput,
        devName: '体验版'
    }, info));
}

// 下载支付宝体验版二维码图片
async function downloadQrCodeImg(qrCodeUrl, qrcodeOutput) {
    return new Promise((resolve, reject) => {
        const stream = request({
            url: qrCodeUrl,
            encoding : null,
            timeout: 5000,
            headers: {
                "User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.75 Safari/537.36"
            },
            gzip:true
        }).pipe(fs.createWriteStream(qrcodeOutput));

        stream.on('finish', () => {
            console.log('完成下载');
            resolve('finish');
        });

        stream.on('error', () => {
            console.log('下载失败');
            reject('error');
        });
    });
}


// 通知小程序信息
async function notificationAppInfo(info={}) {
    const { 
        filePath, 
        version, 
        gitHash, 
        gitCommit,
        name, 
        devName, 
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