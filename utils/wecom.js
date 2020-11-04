const fs = require('fs-extra');
const request = require('request-promise-native');
const {md5} = require('./base');

const {wecom} = require('../config.global.json');

const ACCESS_KEY = wecom.key;
const HOOK_URL = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=' + ACCESS_KEY;

module.exports = {
    sendImgMsg,
    sendMarkdownMsg,
    sendFileMsg
}

// 发送图片信息
async function sendImgMsg(data = {}) {
    if (!wecom.enable) {
        return;
    }

    const {filePath} = data;
    let result;
    try {
        let bitmap = await fs.readFile(filePath);
        let base64 = Buffer.from(bitmap, 'binary').toString('base64');
        let imgMd5 = md5(bitmap);
        const res = await request({
            url: HOOK_URL,
            method: 'post',
            json: {
                "msgtype": "image",
                "image": {
                    "base64": base64, // 图片内容的base64编码
                    "md5": imgMd5 // 图片内容（base64编码前）的md5值
                }
            }
        });
        console.log(res);
        console.log(`发送预览二维码成功`);

        result = res;
    }catch(e) {
        console.error(`发送预览二维码失败，原因${e}`);
    }
    return result;
}

// 发送markdown信息
async function sendMarkdownMsg(data = {}) {
    if (!wecom.enable) {
        return;
    }

    const {name, devName, version, gitHash, platform} = data;
    try {
        let _gitCommit = '';
        if (Array.isArray(data.gitCommit)) {
            data.gitCommit.forEach((gItem) => {
                _gitCommit += gItem + '\n';
            });
            data.gitCommit = _gitCommit;
        }
        const res = await request({
            url: HOOK_URL,
            method: 'post',
            json: {
                "msgtype": "markdown",
                "markdown": {
                    "content": `【${platform}】 <font color=\"warning\">${devName}</font> ${name}小程序<font color=\"info\">发布成功</font>。\n \
                    应用版本: <font color=\"comment\">${version}</font> \n \
                    最新版本: <font color=\"comment\">${gitHash}</font> \n \
                    提交摘要：<font color=\"comment\">${data.gitCommit}</font>`
                }
            }
        });
        console.log(res);
        console.log(`发送应用信息成功`);
    }catch(e) {
        console.error(`发送应用信息失败，原因${e}`);
    }
}

// 发送文件信息
// 1、前提先调用企业微信上传文件接口，返回media_id
// 2、拿media_id发送文件消息，仅三天内有效期
async function sendFileMsg(data = {}) {
    if (!wecom.enable) {
        return;
    }

    const {filePath} = data;
    if (!filePath) {
        return;
    }
    
    try {
        let result = await uploadFile({filePath});
        result = JSON.parse(result);

        const {errcode, media_id} = result;
        if (errcode === 0 && media_id) {
            const res = await request({
                url: HOOK_URL,
                method: 'post',
                json: {
                    "msgtype": "file",
                    "file": {
                        "media_id": media_id
                    }
                }
            });
            console.log(res);
            console.log(`发送文件信息成功`);
        }
    }catch(e) {
        console.error(`发送文件信息失败，原因${e}`);
    }
}

async function uploadFile(info={}) {
    if (!wecom.enable) {
        return;
    }
    
    const {filePath} = info;
    const res = await request({
        url: `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${ACCESS_KEY}&type=file`,
        method: 'post',
        headers: {
            "Content-Type": "multipart/form-data"
        },
        formData: {
            name: 'media',
            file: fs.createReadStream(filePath)
        }
    });
    console.log(res);
    return res;
}