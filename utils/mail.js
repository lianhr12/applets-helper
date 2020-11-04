const mailer = require('nodemailer');
const template = require('art-template');
const path     = require('path');
const fs       = require('fs-extra');

const {email: emailConf} = require('../config.global.json');
const transporter = mailer.createTransport(emailConf);

/**
 * 发送邮件处理
 * sOptions 示例：  
 *  from: 'Nodemailer <example@nodemailer.com>', 发件人的电子邮件地址
 *  to: 'Nodemailer <example@nodemailer.com>', 收件人电子邮件地址
 *  cc: 'Nodemailer <example@nodemailer.com>'  抄送人电子邮件地址
 *  bcc: 'Nodemailer <example@nodemailer.com>'  私密抄送人电子邮件地址
 *  subject: 'AMP4EMAIL message', 邮件主题
 *  text: 'For clients with plaintext support only', 纯文本邮件内容
 *  html: '<p>For clients that do not support AMP4EMAIL or amp content is not valid</p>', html邮件内容
 *  attachments: [{ 
        filename : 'package.json', 
        path: './package.json'
    }] // 附件信息
 * 
 * @param {Object} sOptions 发送配置信息 
 * @memberof MailService
 */
async function sendMail(sOptions){
    try {
        await transporter.sendMail(sOptions);
    }catch (e) {
        console.error(`邮件发送失败，发送信息：发件人->${sOptions.from}，收件人->${sOptions.to}，主题->${sOptions.subject}，具体错误信息: ${e}`);
    }
}

// 获取构建通知模板内容
function getBuildMailTemplate(info = {}) {
    let tplContent = '';
    const tplPath = path.resolve(__filename, '../../template/build-info.html');

    if (!fs.existsSync(tplPath)) {
        return tplContent;
    }
    
    tplContent = template(tplPath, info);
    return tplContent;
}

// 发送小程序构建信息
exports.sendAppBuildInfo = (info = {}) => {
    if (!emailConf.enable) {
        return;
    }
    
    const {platform, qcodePath, devName, version} = info;
    let _gitCommit = '';
    if (Array.isArray(info.gitCommit)) {
        info.gitCommit.forEach((gItem) => {
            _gitCommit += `<p style="margin: 5px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;">${gItem}</p>`;
        });
        info.gitCommit = _gitCommit;
    }
    const config  = {
        from: `<${emailConf.auth.user}>`,
        to  : emailConf.recipient.join(','),
        cc  : emailConf.cc.join(','),
        subject: `【${platform}】${devName}-${version} 小程序构建结果`,
        html: getBuildMailTemplate(info),
        attachments: [{
            filename: 'qcode.jpg',
            path: qcodePath,
            cid: 'qcode_img_url'
        }]
    };
    sendMail(config);
}