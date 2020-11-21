# wxpostdemo


# 一、开发需求

最近项目中遇到一个需求，就是实现一个可以分享到朋友图的海报，朋友圈用户扫码进入小程序。

# 二、开发思路

1. 这个需求，在微信小程序很常见，我这边主要是参考金数据，以及开发者头条的小程序分享海报进行界面和功能设计
2. 界面元素有：
   1. 微信头像
   2. 海报背景
   3. 小程序二维码
   4. 授权
   5. 保存到相册
3. 小程序推出来好几年了，生成朋友圈海报的功能也不复杂，应该有很多轮子，可以借用一下。



# 三、参考

功能上，主要参考了金数据和开发者头条的小程序

技术上：小程序海报生成组件，参考了以下代码

1. https://github.com/WGinit/mini-poster
2. https://developers.weixin.qq.com/community/develop/article/doc/000e222d9bcc305c5739c718d56813
3. https://github.com/kuckboy1994/mp_canvas_drawer.git
4. https://github.com/jasondu/wxa-plugin-canvas.git
5. https://github.com/yicm/WxPoster.git



# 四、技术难点及关键代码

1. 授权获取微信头像，并下载到本地

   1. 获取用户的头像

   2. 下载，注意需要增加 https://thirdwx.qlogo.cn到小程序控制台页面中uploadFile合法域名的的下载domian list中，否则手机端会报错：

      > url not in domain list

      在微信控制台配置好以后，还需要等一段时间，才能生效。我是等了1个小时。

   >  async getUserInfo() {
   >
   > ​    console.log('enter getUserInfo')
   >
   > ​    let that = this;
   >
   > ​    return new Promise((resolve, reject) => {
   >
   > ​      wx.getUserInfo({
   >
   > ​        success(res) {
   >
   > ​          // console.log("获取用户信息成功", res)
   >
   > ​          app.globalData.wxUserInfo = res.userInfo;
   >
   > ​          that.data.isUserInfoAuth = true
   >
   > ​          resolve(res)
   >
   > ​        },
   >
   > ​        fail(err) {
   >
   > ​          wx.getSetting({
   >
   > ​            success(res) {
   >
   > ​              //已授权
   >
   > ​              if (res.authSetting['scope.userInfo']) {
   >
   > ​                wx.showToast({
   >
   > ​                  title: '获取用户权限失败，请重试',
   >
   > ​                  icon: 'none',
   >
   > ​                  duration: 4000
   >
   > ​                })
   >
   > ​              }else{
   >
   > ​                wx.showToast({
   >
   > ​                  title: '获取用户权限失败，请授权',
   >
   > ​                  icon: 'none',
   >
   > ​                  duration: 4000
   >
   > ​                })
   >
   > ​                that.setData({
   >
   > ​                  modalName: 'bottomModalUserInfo',
   >
   > ​                  isUserInfoAuth:false
   >
   > ​                })
   >
   > ​              }
   >
   > ​            },fail : error=>{
   >
   > ​              wx.showToast({
   >
   > ​                title: '获取用户权限失败，请重试',
   >
   > ​                icon: 'none',
   >
   > ​                duration: 4000
   >
   > ​              })
   >
   > ​            }
   >
   > ​          })
   >
   > ​          reject(err)
   >
   > ​        }
   >
   > ​      })
   >
   > ​    })
   >
   >   },

2. 授权将海报保存到本地

   > ​	eventSave() {
   >
   > ​    let that = this;
   >
   > ​    if(this.data.shareImage===''){
   >
   > ​      wx.showToast({
   >
   > ​        title: '请先生成海报',
   >
   > ​        icon:'none',
   >
   > ​        duration: 4000
   >
   > ​      })
   >
   > ​      return
   >
   > ​    }
   >
   > ​    wx.saveImageToPhotosAlbum({
   >
   > ​      filePath: this.data.shareImage,
   >
   > ​      success(res) {
   >
   > ​        console.log(res,that.data.shareImage)
   >
   > ​        wx.showToast({
   >
   > ​          title: '保存图片成功',
   >
   > ​          icon: 'success',
   >
   > ​          duration: 2000
   >
   > ​        })
   >
   > ​        wx.previewImage({
   >
   > ​          urls: [this.data.shareImage,...this.data.tempFileList],
   >
   > ​        })
   >
   > ​      },
   >
   > ​      fail: err => {
   >
   > ​        console.log(err)
   >
   > ​        wx.showToast({
   >
   > ​          title: err.errMsg,
   >
   > ​        })
   >
   > ​        //显示授权图片页面
   >
   > ​        that.setData({
   >
   > ​          modalName:'bottomModalSetting'
   >
   > ​        })
   >
   > ​      }
   >
   > ​    })
   >
   >   },

3. 小程序二维码的生成以及下载

   1. 二维码的生成以及下载，参考https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html 
   2. 因为生成二维码会用到token，token是放到服务器端统一保存的，所以建议后端生成二维码后，供前端下载使用，不过我在写前端的时候，还是基于前端生成二维码，做了个demo

   >   async getQrCode() {
   >
   > ​    wx.showLoading({
   >
   > ​      title: '获取二维码',
   >
   > ​    })
   >
   > ​    let that = this;
   >
   > ​    if (this.data.accessToken === '') {
   >
   > ​     await  this.getAccessToken()
   >
   > ​    }
   >
   > ​    console.log('accessToken',this.data.accessToken )
   >
   > ​    return new Promise((resolve, reject) => {
   >
   > ​      wx.request({
   >
   > ​        url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + this.data.accessToken,
   >
   > ​        method: 'POST',
   >
   > ​        data: {
   >
   > ​          scene: 1012,
   >
   > ​          "width": 430,
   >
   > ​          // 是否为Png，默认jpeg
   >
   > ​          is_hyaline: true,
   >
   > ​          // 是否自动取色
   >
   > ​          auto_color: true,
   >
   > ​          // page: 'pages/credit/survey/survey',
   >
   > ​          page: 'pages/index/index'
   >
   > ​        },
   >
   > ​        responseType: 'arraybuffer',
   >
   > ​        success:function(res){
   >
   > ​          
   >
   > ​          const fs = wx.getFileSystemManager(); //获取全局唯一的文件管理器
   >
   > ​          console.log(wx.env.USER_DATA_PATH+"/1.jpeg")
   >
   > ​          fs.writeFile({ // 写文件
   >
   > ​            filePath: that.data.qrCodeTmpPath, // wx.env.USER_DATA_PATH 指定临时文件存入的路径，后面字符串自定义
   >
   > ​            data: res.data,
   >
   > ​            encoding: "binary", //二进制流文件必须是 binary
   >
   > ​            success (res){
   >
   > ​              that.data.qrCodeLocalPath = that.data.qrCodeTmpPath;
   >
   > ​              resolve(res)
   >
   > ​            },
   >
   > ​            fail(err){
   >
   > ​              console.log(err)
   >
   > ​              reject(err)
   >
   > ​            }
   >
   > ​          });
   >
   > ​        },
   >
   > ​        fail:function(err){
   >
   > ​          console.log(err)
   >
   > ​          reject(err)
   >
   > ​        }
   >
   > ​      })
   >
   > ​    })
   >
   > ​    
   >
   >   }

4. 海报背景图的的存储

   可以放本地，也可以放在服务器上面，不过基于小程序的项目大小限制，所以建议放到服务器上。可以使用腾讯的云开发模式，把图片放到云存储上。

5. 生成海报

   大部分github的demo都是基于canvas来生成的。因为元素不太复杂，可以直接硬编码，不过也有一些是进行了json配置化。我觉得主要难点是，坐标不太好确定。

6. 权限控制

   1. 需要申请读取用户信息，以及相册信息

   >   <button class="bg-green" open-type='getUserInfo' bindgetuserinfo="bindGetUserInfo">微信授权用户信息</button>
   >
   >   <button type='primary' class='openSetting' open-type="openSetting"
   >           bindopensetting='handleSetting'>微信授权写入本地相册</button>

# 五、代码

参考：

https://github.com/ghl116/wxposterdemo.git    

 poster2的相关页面



