const fs = require('fs-extra');
const request = require('request-promise-native');

const {dingtalk} = require('../config.global.json');

const WEB_HOOK_URL = 'https://oapi.dingtalk.com/robot/send';
const access_token = dingtalk.access_token;

async function sendDingTalkMarkdownMsg(data = {}, filePath) {
    if (!dingtalk.enable) {
        return;
    }

    const {name, devName, version, gitHash, platform} = data;
    try {
        let _gitCommit = '';
        if (Array.isArray(data.gitCommit)) {
            data.gitCommit.forEach((gItem) => {
                _gitCommit += gItem + '\n\r';
            });
            data.gitCommit = _gitCommit;
        }

        let qrcode = '';
        // 二维码图片转换成base64发送
        if (fs.existsSync(filePath)) {
            const bitmap = await fs.readFile(filePath);
            const base64str = Buffer.from(bitmap, 'binary').toString('base64');
            qrcode = `![qrcode](data:image/png;base64,${base64str})`;
        }

        const res = await request({
            url: WEB_HOOK_URL + `?access_token=${access_token}`,
            method: 'post',
            json: {
                "msgtype": "markdown",
                "markdown": {
                    "title": '小程序构建通知',
                    "text": `### 【${platform}】 ${devName} ${name}小程序发布成功\n\r#### 应用版本: **${version}** \n\r#### 最新版本: **${gitHash}** \n\r #### 提交摘要：${data.gitCommit}\n\r${qrcode}`
                }
            }
        });
        if (res.errcode === 0) {
            console.log(`发送钉钉信息成功`);
        }else {
            console.error(`发送钉钉信息失败，原因`, res);
        }
    }catch(e) {
        console.error(`发送钉钉信息失败，原因`, e);
    }
}

module.exports = {
    sendDingTalkMarkdownMsg
}
