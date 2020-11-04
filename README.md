> applets-helper 支持市场上主流的小程序，在脱离IDE工具的情况下，通过命令行工具可以快速发布预览和体验版本，同时集成了邮件和企业微信等通知方式，方便持续构建和快速部署（Jenkins/Gilab CI）和通知测试人员跟进测试。

## 一、前置依赖&要求
### 1.1 安装applets
```shell
npm install applets-helper -g
```



### 1.2 通知模块配置
创建`applets.global.json`文件，下面是相关配置说明，注入到全局配置，配置信息如下：

```json
{
    "wecom"   : {
		"enable": true,
    	"key" : "xxxxx"
    },
    "email"   : {
		"enable": true,
    	"service":"163", 
    	"secureConnection": true,
	    "auth": {
	        "user": "user",
	        "pass": "password"
	    },
        "recipient": ["xxx@gmail.com"],
        "cc": ["xxx@qq.com"]
    }
}
```

### 1.3 企业微信
在群聊右击，添加群机器人，随后给hook的url地址，把`key`值记录下来，具体示例：
```javascript
"wecom": {
	// 是否启用企业微信通知
	"enable": true,
	"key": "xxxxx"
}
```

### 1.4 配置邮件
邮件模块支持基于nodemailer，配置信息请参考文档的`nodemailer.createTransport`配置（https://nodemailer.com/smtp/） ，示例如下：
```javascript
nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: "username",
    pass: "password"
  }
});
 ```
 
 除此之前还额外增加`recipient`（收件人）和`cc`（抄送）两个参数配置，具体示例：

``` javascript
"email": {
	// 是否启用邮件通知
	"enable": true,
	"service": "163",
	"secureConnection": true,
	"auth": {
		"user": "user",
		"pass": "password"
	},
	"recipient": [
		"xxx@gmail.com"
	],
	"cc": []
}
``` 
### 1.5 初始化&重置全局配置
然后通过提供的命令行注入：

```shell
applets --config applets.global.json
```

查看全局配置信息

```shell
applets --config list

# 输出信息：
{ applications:
   { alipay: { name: '', version: '', appId: '', toolId: '', privateKey: '' },
     wechat: { name: '', version: '', appId: '', privateKeyPath: '' } },
  wecom: { enable: true, key: '' },
  email:
   { enable: true,
     service: '163',
     secureConnection: true,
     auth: { user: '', pass: '' },
     recipient: [],
     cc: [] } }
```


## 二、发布支付宝小程序
官方cli工具文档地址：https://opendocs.alipay.com/mini/tool/sdk

### 2.1 获取toolId和私钥方式
https://opendocs.alipay.com/mini/alipaydev

#### 2.1.1、alipay-dev生成公钥和私钥

```
alipaydev key create -w

# 根据打开的路径输出以下文件
公钥已保存到: path\pkcs8-public-pem
私钥已保存到: path\pkcs8-private-pem
```

#### 2.1.2、获取toolId
填写上面生成的公钥信息(pkcs8-public-pem)，生成toolId
https://openhome.alipay.com/dev/workspace/key-manage/tool


### 2.2、项目配置
在小程序项目文件夹下，创建`applets.local.json`文件，具体如下：
```
{
	"name": "applets test",
	// 版本号，提交小程序体验版时，要求版本号必须递增
	"version": "1.0.0",
	"toolId": "工具id",
	"appId" : "应用id",
	"privateKey": "pkcs8-private-pem的内容"	
}
```

### 2.3、命令参数

```
# 打开项目目录（根目录）
cd /path/project

# 提交预览版本
applets --alipay preview

# 提交体验版本
applets --alipay upload
```



## 三、发布微信小程序
官方cli工具文档地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html

### 3.1、获取密钥信息
获取小程序上传密钥，访问"微信公众平台（https://mp.weixin.qq.com/）-开发-开发设置"后下载代码上传密钥
分别得到"AppID"和"代码上传密钥"。

```
秘钥文件格式一般为: private.wx4546464564.key
```
建议将文件保存到项目根下，或者统一目录存放，后面配置`privateKeyPath`注意填写，固定路径写绝对路径，建议是相对路径

### 3.2、IP白名单配置
这个视个人情况而定，开发机器公网IP地址固定，可以配置白名单IP地址，安全性更高些，如果IP地址变化，建议不开启，直接跳过该配置。

### 3.3、项目配置
在小程序项目文件夹下，创建`applets.local.json`文件，具体如下：
```json
{
	"name": "applets test",
	"version": "1.0.9",
	"appId" : "xxx",
	"privateKeyPath": "./private.wx820251fbda61f637.key"
}

```

### 3.4、如何获取体验版二维码
这里需要说明一下，微信体验版是没有返回二维码图片的，但是以往的体验版二维码也不会过期，所以才需要手动下载一份二维码命名保存下来，方便后面通知使用。

#### 3.4.1 API 方式获取
操作过程步骤多，相对繁琐，不建议使用该方法。
https://developers.weixin.qq.com/doc/oplatform/Third-party_Platforms/Mini_Programs/code/get_qrcode.html

#### 3.4.2 管理后台下载
小程序后台-管理-版本管理-开发版本-找到体验版二维码-下载
保存到小程序项目根目录下的"temp/"，并命名"upload-wechat.jpg"

### 3.5、命令参数

```
# 打开项目目录（根目录）
cd /path/project

# 提交预览版本
applets --wechat preview
 
# 提交体验版本
applets --wechat upload
```

## 注意事项
由于通知的内容会获取小程序目录git仓库的最新提交hash版本，以及最近3条提交记录作为通知摘要，为了防止报错，执行前请确保项目文件夹有git仓库记录。

## 支付小程序发布示例（github仓库/example/alipay目录）

applets.global.json 只有首次配置通知模块信息需要使用，或者后续修改时使用，假设我们已经获取到邮件和企业微信等通知配置的相关信息。

在根目录下打开命令行执行：

```shell
applets --config applets.global.json
```


检查配置信息：

```shell
applets --config list
```

我们将applets.local.json文件的小程序依赖配置信息补充，主要信息上面有说明及获取。

确认无误后，在根目录下打开命令行执行：



1、发布预览版
```
applets --alipay preview
```


2、发布体验版
```
applets --alipay upload
```

![目录结构][1]


如果跑完没有问题，不出意外可以看到相关的通知信息：

![企业微信通知][2]

 ![邮件通知][3]


  [1]: https://cdn.nlark.com/yuque/0/2020/png/179989/1604486317473-43e84347-03ab-40be-b4a7-f5f93f40ca14.png
  [2]: https://cdn.nlark.com/yuque/0/2020/png/179989/1604486771582-30769de0-37b3-4762-9770-36de51c10ca6.png
  [3]: https://cdn.nlark.com/yuque/0/2020/png/179989/1604486728114-3f570321-393d-4a43-bb91-0689436764e6.png