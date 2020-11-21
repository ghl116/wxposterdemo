// pages/credit/poster.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    accessToken: '',
    resultImage: '',
    avatarImageRemotePath:'', //头像
    bgImgRemotePath :'https://6369-cib-5nttm-1302391714.tcb.qcloud.la/post2.jpg?sign=5df45bdb40affa97be96c43fe8fc7fa9&t=1605960071',
    qrCodeRemotePath : 'https://6369-cib-5nttm-1302391714.tcb.qcloud.la/qrcode_posterTest.jpg?sign=597f2cf8455a3f10986bf53c75f95de9&t=1605923599',
    avatarImageLocalPath:'', //头像
    bgImgLocalath :'',
    qrCodeTmpPath :wx.env.USER_DATA_PATH+"/1.jpeg",
    qrCodeLocalPath : ''
    

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.init()

  },
  async init(){
    try{
      await this.getUserInfo()
      await this.getQrCode()
      await this.downLoadFile()
      this.drawImage();
    }catch(err){
      console.log(err)
      wx.showToast({
        title: '出错了'+err,
      })
    }
    
  },
  async getUserInfo() {
    wx.showLoading({
      title: '获取用户信息',
    })
    console.log('enter getUserInfo')
    let that = this;
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success(res) {
          console.log("获取用户信息成功", res)
          app.globalData.wxUserInfo = res.userInfo;
          that.data.avatarImageRemotePath = res.userInfo.avatarUrl
          resolve(res)
        },
        fail(err) {
          wx.getSetting({
            success(res) {
              //已授权
              if (res.authSetting['scope.userInfo']) {
                wx.showToast({
                  title: '获取用户权限失败，请重试',
                  icon: 'none',
                  duration: 4000
                })
              }else{
                wx.showToast({
                  title: '获取用户权限失败，请授权',
                  icon: 'none',
                  duration: 4000
                })
                that.setData({
                  modalName: 'bottomModalUserInfo',
                  isUserInfoAuth:false
                })
              }
            },fail : error=>{
              wx.showToast({
                title: '获取用户权限失败，请重试',
                icon: 'none',
                duration: 4000
              })
            }
          })
          reject(err)
        }
      })
    })
  },
  async downLoadFile(){
    wx.showLoading({
      title: '下载文件',
    })
    
    const imgList = [this.data.avatarImageRemotePath,this.data.bgImgRemotePath]
    console.log(this.data.qrCodeLocalPath)
    if(this.data.qrCodeLocalPath ===''){
      imgList.push(this.data.qrCodeRemotePath)
    }
    console.log('imgList',imgList)
    const imageList = []
    let that  = this;
    for (let i = 0; i < imgList.length; i++) {
      imageList.push(this.getImageInfo(imgList[i]))
    }
    console.log('getImagesInfo imageList',imageList)
    return new Promise((resolve, reject) => {
      Promise.all(imageList).then(res => {
        that.data.avatarImageLocalPath = res[0]
        that.data.bgImgLocalath = res[1]
        if(this.data.qrCodeLocalPath ===''){
          that.data.qrCodeLocalPath = res[2]
        }
        
        resolve(res)
      }).catch(err => {
        console.log(err)
        
        wx.showModal({
          title: '警告',
          content: '图片下载失败，请检查网络'+err,
          showCancel: false
        })
        reject(res)
      })
    })
    
  },
  getImageInfo (url) {
    return new Promise((resolve, reject) => {
      const objExp = new RegExp(/^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/)
        if (objExp.test(url)) {
            wx.downloadFile({
            url: url,
            success:res=>{
              resolve(res.tempFilePath)
            },
            fail:err=>{
              console.log('err',err)
            }
          })
        } else {
          resolve(url)
        }
    })
  },
  drawImage() {
    wx.showLoading({
      title: '开始生成海报',
    })
    const ctx = wx.createCanvasContext("cv-pic");
    // 填充背景色
    ctx.setFillStyle("#f8f8f8");
    ctx.fillRect(0, 0, 300, 440);
    ctx.fill();
    ctx.setFillStyle("#ffffff");
    ctx.fillRect(0, 400, 300, 100);
    ctx.fill();
    // 填充背景图
    ctx.drawImage(this.data.bgImgLocalath, 30, 20, 240, 365);
    // 写入名字
    ctx.setFontSize(15);
    ctx.setFillStyle("#322F30");
    ctx.fillText("poster", 61, 300);
    // 写两行提示
    ctx.setFillStyle("#322F30");
    ctx.setFontSize(14);
    ctx.fillText("长按识别小程序码", 33, 440);
    ctx.fillText("超值礼包等你来抢", 33, 465);
    // 填充小程序码
     ctx.drawImage(this.data.qrCodeLocalPath, 180, 415, 60,60);
    console.log('--------',this.data.avatarImageLocalPath)
    // ctx.drawImage("/images/logo2.png", 0, 0, 280, 280, 200, 410, 80, 80);
    // ctx.drawImage(this.data.avatarImagePath, 0, 0, 280, 280, 200, 410, 80, 80);
       //绘制头像
       ctx.arc(186, 246, 30, 0, 2 * Math.PI) //画出圆
       ctx.strokeStyle = "#ffe200";
       ctx.clip(); //裁剪上面的圆形
      //  ctx.drawImage(this.data.avatarImagePath, 136, 196, 100, 100); // 在刚刚裁剪的园上画图
       ctx.drawImage(this.data.avatarImageLocalPath,156, 216, 60, 60)
    const that = this;
    // 把canvas图保存到临时目录
    // this.canvasToImage("cv-pic")
    ctx.draw(false, function () {
      wx.canvasToTempFilePath({
        canvasId: "cv-pic",
        success(res) {
          let url = res.tempFilePath;
          that.data.resultImage = url;
          wx.showToast({
            title: '海报生成成功',
            icon: 'none',
            duration: 4000
          })
        } 
      });
    });
  },
  previewImg() {
    if (this.data.resultImage) {
      //预览图片，预览后可长按保存或者分享给朋友
      wx.previewImage({
        urls: [this.data.resultImage]
      })
    }
  },
  savePoster() {
    if (this.poster) {
      wx.saveImageToPhotosAlbum({
        filePath: this.poster,
        success: (result) => {
          wx.showToast({
            title: '海报已保存，快去分享给好友吧。',
            icon: 'none'
          })
        }
      })
    }
  },
  saveToPhotosAlbum() {
    if (!this.data.resultImage) return;
    const that = this;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultImage,
      success: function() {
        // wx.showToast({
        //   title: "保存成功",
        //   icon: "success",
        //   duration: 2000
        // });
        wx.showModal({
          content: '图片已保存到相册，赶紧晒一下吧~',
          showCancel: false,
          confirmText: '好的',
          confirmColor: '#333',
          success: function (res) {
            if (res.confirm) {
              console.log('用户点击确定');
            }
          },fail:function(res){
            console.log(res)
          }
        })
      },
      fail: function () {
        that.getWriteToAlbumSetting()
      }
    });
  },
  async openAlbumSetting() {
    // 还是对微信API的同步封装
    let status = await wx.openSetting('writePhotosAlbum')
    // false表示又拒绝了
    if (status === false) return
    // 只有明确授权了才进行保存到相册的操作
    this.canWriteToAlbum = true
    this.saveToPhotosAlbum()
  },
  async getWriteToAlbumSetting() {
    // this.getSetting 方法也是对wx.getSetting的一个同步封装处理
    let status = await wx.getSetting('writePhotosAlbum')
    // 因为用户第一次进行操作的时候，授权状态为undefined，只有在明确拒绝过的时候才会是false
    if (status === true || status === undefined) {
      this.canWriteToAlbum = true
    } else {
      this.canWriteToAlbum = false
    }
  },
  async getAccessToken() {
    wx.showLoading({
      title: '获取token',
    })
    //请补充相关信息
    var appid = 'XXXX'
    var secret = 'XXXX'
    let that = this
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`,
        method: 'GET',
        success: function (res) {
          console.log('access_token', res)
          that.data.accessToken = res.data.access_token;
          wx.setStorageSync('accessToken', res.data.access_token)
          resolve(res)
        },
        fail:err=>{
          console.log('get token error', error )
          reject(err)
        }
      })
    })
  },
  async getQrCode() {
    wx.showLoading({
      title: '获取二维码',
    })
    let that = this;
    if (this.data.accessToken === '') {
     await  this.getAccessToken()
    }
    console.log('accessToken',this.data.accessToken )
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=' + this.data.accessToken,
        method: 'POST',
        data: {
          scene: 1012,
          "width": 430,
          // 是否为Png，默认jpeg
          is_hyaline: true,
          // 是否自动取色
          auto_color: true,
          // page: 'pages/credit/survey/survey',
          page: 'pages/index/index'
        },
        responseType: 'arraybuffer',
        success:function(res){
          
          const fs = wx.getFileSystemManager(); //获取全局唯一的文件管理器
          console.log(wx.env.USER_DATA_PATH+"/1.jpeg")
          fs.writeFile({ // 写文件
            filePath: that.data.qrCodeTmpPath, // wx.env.USER_DATA_PATH 指定临时文件存入的路径，后面字符串自定义
            data: res.data,
            encoding: "binary", //二进制流文件必须是 binary
            success (res){
              that.data.qrCodeLocalPath = that.data.qrCodeTmpPath;
              resolve(res)
            },
            fail(err){
              console.log(err)
              reject(err)
            }
          });
        },
        fail:function(err){
          console.log(err)
          reject(err)
        }
      })
    })
    
  }

})