
//index.js
const app = getApp()
Page({
  data: {
    painting: {},
    shareImage: '',
    modalName: '',
    isUserInfoAuth: undefined,
    qrCodePath : '',
    index:0
  },
  onLoad() {
    let that = this;
    this.init()
    
  },
  async init(){
    this.setData({
      painting:{
        view: []
      }
    })
    let that = this;
    try{
      //获取用户信息
      await this.getUserInfo()
      //获取用户信息成功
      if(this.data.isUserInfoAuth){  
        await this.getQrCode()
        this.eventDraw()
      }
    }catch(err){
      console.log(err)
      wx.showToast({
        title: err,
        icon: 'none',
        duration: 4000
      })
    }
  },

  async getUserInfo() {
    console.log('enter getUserInfo')
    let that = this;
    return new Promise((resolve, reject) => {
      wx.getUserInfo({
        success(res) {
          // console.log("获取用户信息成功", res)
          app.globalData.wxUserInfo = res.userInfo;
          that.data.isUserInfoAuth = true
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
  bindGetUserInfo: function (e) {
    let that = this;
    console.log(e)
    if (e.detail.userInfo) {
      that.setData({
        isUserInfoAuth: true,
        modalName:''
      })
      console.log('授权通过')
      that.init()
      //用户按了允许授权按钮
    } else {
      //用户按了拒绝按钮
      console.log('授权不通过')
      that.setData({
        isUserInfoAuth: false
      })
    }
  },
  eventDraw() {

    console.log('enter eventDraw')
    this.setData({
      painting: {
        width: 375,
        height: 555,
        clear: true,
        views: [{
            //整体背景
            type: 'rect',
            background: 'white',
            top: 0,
            left: 0,
            width: 375,
            height: 555
          },
          //头像
          {
            type: 'image',
            name:'avatar',
            url: app.globalData.wxUserInfo.avatarUrl,
            // url: '/images/avatar.jpeg',
            top: 27.5,
            left: 29,
            width: 55,
            height: 55
          },
          {
            type: 'text',
            content: '您的好友【' + app.globalData.wxUserInfo.nickName + '】',
            fontSize: 16,
            color: '#402D16',
            textAlign: 'left',
            top: 33,
            left: 96,
            bolder: true
          },
          {
            type: 'text',
            content: '邀请你填写扫码',
            fontSize: 15,
            color: '#563D20',
            textAlign: 'left',
            top: 59.5,
            left: 96
          },
          //中间背景
          {
            type: 'image',
            name:'bgImg',
            url: 'https://6369-cib-5nttm-1302391714.tcb.qcloud.la/post2.jpg?sign=5df45bdb40affa97be96c43fe8fc7fa9&t=1605960071',
            top: 100,
            left: 29,
            width: 320,
            height: 330
          },
          //二维码
          {
            type: 'image',
            name:'qrCode',
            url: this.data.qrCodePath,
            top: 443,
            left: 29,
            width: 100,
            height: 100
          },
          // {
          //   type: 'text',
          //   content: '正品MAC魅可口红礼盒生日唇膏小辣椒Chili西柚情人',
          //   fontSize: 16,
          //   lineHeight: 21,
          //   color: '#383549',
          //   textAlign: 'left',
          //   top: 336,
          //   left: 44,
          //   width: 287,
          //   MaxLineNumber: 2,
          //   breakWord: true,
          //   bolder: true
          // },
          // {
          //   type: 'text',
          //   content: '￥0.00',
          //   fontSize: 19,
          //   color: '#E62004',
          //   textAlign: 'left',
          //   top: 387,
          //   left: 44.5,
          //   bolder: true
          // },
          // {
          //   type: 'text',
          //   content: '原价:￥138.00',
          //   fontSize: 13,
          //   color: '#7E7E8B',
          //   textAlign: 'left',
          //   top: 391,
          //   left: 110,
          //   textDecoration: 'line-through'
          // },
          {
            type: 'text',
            content: '长按识别图中二维码，进入填单页面',
            fontSize: 14,
            color: '#383549',
            textAlign: 'left',
            top: 460,
            left: 165.5,
            lineHeight: 20,
            MaxLineNumber: 2,
            breakWord: true,
            width: 125
          }
        ]
      }
    })
  },
  eventSave() {
    let that = this;
    if(this.data.shareImage===''){
      wx.showToast({
        title: '请先生成海报',
        icon:'none',
        duration: 4000
      })
      return
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.shareImage,
      success(res) {
        console.log(res,that.data.shareImage)
        wx.showToast({
          title: '保存图片成功',
          icon: 'success',
          duration: 2000
        })
        wx.previewImage({
          urls: [this.data.shareImage,...this.data.tempFileList],
        })
      },
      fail: err => {
        console.log(err)
        wx.showToast({
          title: err.errMsg,
        })
        //显示授权图片页面
        that.setData({
          modalName:'bottomModalSetting'
        })
      }
    })
  },
  previewImg(event) {
    if (this.data.shareImage!='') {
      //预览图片，预览后可长按保存或者分享给朋友
      
      const images = [this.data.shareImage,...this.data.tempFileList]
      // console.log(images)
      const current = images[this.data.index];
      this.data.index++
      if(this.data.index ==images.length){
        this.data.index = 0
      }
      wx.previewImage({
        urls: images,
        current: current
      })
    }
  },
  handleSetting: function (e) {
    let that = this;
    // 对用户的设置进行判断，如果没有授权，即使用户返回到保存页面，显示的也是“去授权”按钮；同意授权之后才显示保存按钮
    if (!e.detail.authSetting['scope.writePhotosAlbum']) {
      wx.showModal({
        title: '警告',
        content: '若不打开授权，则无法将图片保存在相册中！',
        showCancel: false
      })
      that.setData({
        saveImgBtnHidden: true,
        openSettingBtnHidden: false
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '您已授权，赶紧将图片保存在相册中吧！',
        showCancel: false
      })
      that.setData({
        modalName:''
      })
    }
  },
  eventGetImage(event) {
    console.log('event',event)
    wx.hideLoading()
    const {
      tempFilePath,
      tempFileList,
      errMsg
    } = event.detail
    if (errMsg === 'canvasdrawer:ok') {
      this.setData({
        shareImage: tempFilePath,
        tempFileList:tempFileList
      })
    }
  },

  async getQrCode() {
    this.data.qrCodePath = 'https://6369-cib-5nttm-1302391714.tcb.qcloud.la/qrcode_jinshuju.png?sign=03c91da758b3180618e9cdb4e5ad0ff9&t=1605959935'
  }
})