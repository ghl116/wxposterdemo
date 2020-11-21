/* global Component wx */

Component({
  properties: {
    painting: {
      type: Object,
      value: {view: []},
      observer (newVal, oldVal) {

        if (!this.data.isPainting) {
          if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
            if (newVal && newVal.width && newVal.height) {
              this.setData({
                showCanvas: true,
                isPainting: true
              })
              try{
                this.readyPigment()
              }catch(err){
                console.error(err)
                wx.showModal({
                  title: '警告',
                  content: '生成海报失败'+err.errMsg,
                  showCancel: false
                })
                wx.hideLoading({
                  success: (res) => {},
                })
              }
            }
          } else {
            if (newVal && newVal.mode !== 'same') {
              this.triggerEvent('getImage', {errMsg: 'canvasdrawer:samme params'})
            }
            wx.showLoading({
              title: 'canvasdrawer:samme params',
            })
          }
        }
      }
    }
  },
  data: {
    showCanvas: false,

    width: 100,
    height: 100,

    tempFileList: [], //图片临时文件

    isPainting: false //防止在canvas绘图中，多次生成
  },
  ctx: null,
  cache: {},
  ready () {
    wx.removeStorageSync('canvasdrawer_pic_cache')
    this.cache = wx.getStorageSync('canvasdrawer_pic_cache') || {}
    this.ctx = wx.createCanvasContext('canvasdrawer', this)
  },
  methods: {
    resetData(){
      this.setData({
        showCanvas: false,
        isPainting: false,
        tempFileList: []
      })
    },
    readyPigment () {
      const { width, height, views } = this.data.painting
      this.setData({
        width,
        height
      })

      const inter = setInterval(() => {
        if (this.ctx) {
          clearInterval(inter)
          this.ctx.clearActions()
          this.ctx.save()
          this.getImagesInfo(views)
        }else{
          console.error("this.ctx is null")
        }
      }, 100)
    },
    getImagesInfo (views) {
      wx.showLoading({
        title: '开始下载背景图片……',
      })
      const imageList = []
      for (let i = 0; i < views.length; i++) {
        if (views[i].type === 'image') {
          // console.log(i+' '+views[i].name+views[i].url)
          imageList.push(this.getImageInfo(views[i].url))
        }
      }
      console.log('getImagesInfo imageList',imageList)
    
      Promise.all(imageList).then(res => {
        // console.log('imageList finish',res)
        let tempFileList = []
        for (let i = 0; i < res.length; i++) {
          tempFileList = tempFileList.concat(res[i])
        }
        this.setData({
          tempFileList
        })
        wx.showLoading({
          title: '开始生成海报',
        })
        this.startPainting()
      }).catch(err => {
        console.log(err)
        this.resetData()
        // wx.showToast({
        //   title: '图片下载失败，请检查网络',
        //   duration: 2000
        // })
        wx.showModal({
          title: '警告',
          content: '图片下载失败，请检查网络'+err,
          showCancel: false
        })
      })
    },
    startPainting () {
      const { tempFileList, painting: { views } } = this.data
      console.log('startPainting',tempFileList)
    // 填充背景色
      for (let i = 0, imageIndex = 0; i < views.length; i++) {
         if (views[i].type === 'rect') {
          this.drawRect(views[i])
        }
        else if (views[i].type === 'image') {
          this.drawImage({
            ...views[i],
            url: tempFileList[imageIndex]
          })
          imageIndex++
        } else if (views[i].type === 'text') {
          if (!this.ctx.measureText) {
            wx.showModal({
              title: '提示',
              content: '当前微信版本过低，无法使用 measureText 功能，请升级到最新微信版本后重试。'
            })
            this.triggerEvent('getImage', {errMsg: 'canvasdrawer:version too low'})
            return
          } else {
            this.drawText(views[i])
          }
        } 
      }
      console.log('start paiting end of cavas')
      let that = this;
      // this.ctx.draw(false, setTimeout(function (e) {
      //   that.saveImageToLocal()
      // }, 220)) // end second draw
      
      this.ctx.draw(false, () => {
        console.log('ctr draw')
        wx.setStorageSync('canvasdrawer_pic_cache', this.cache)
        const system = wx.getSystemInfoSync().system
        if (/ios/i.test(system)) {
          this.saveImageToLocal()
        } else {
          // 延迟保存图片，解决安卓生成图片错位bug。
          setTimeout(() => {
            this.saveImageToLocal()
          }, 800)
        }
      })
    },
    drawImage (params) {
      this.ctx.save()
      const { url, top = 0, left = 0, width = 0, height = 0, borderRadius = 0, deg = 0 } = params
      // if (borderRadius) {
      //   this.ctx.beginPath()
      //   this.ctx.arc(left + borderRadius, top + borderRadius, borderRadius, 0, 2 * Math.PI)
      //   this.ctx.clip()
      //   this.ctx.drawImage(url, left, top, width, height)
      // } else {
      if (deg !== 0) {
        this.ctx.translate(left + width/2, top + height/2)
        this.ctx.rotate(deg * Math.PI / 180)
        this.ctx.drawImage(url, -width/2, -height/2, width, height)
      } else {
        this.ctx.drawImage(url, left, top, width, height)
      }
      // }
      this.ctx.restore()
    },
    drawText (params) {
      this.ctx.save()
      const {
        MaxLineNumber = 2,
        breakWord = false,
        color = 'black',
        content = '',
        fontSize = 16,
        top = 0,
        left = 0,
        lineHeight = 20,
        textAlign = 'left',
        width,
        bolder = false,
        textDecoration = 'none'
      } = params
      
      this.ctx.beginPath()
      this.ctx.setTextBaseline('top')
      this.ctx.setTextAlign(textAlign)
      this.ctx.setFillStyle(color)
      this.ctx.setFontSize(fontSize)

      if (!breakWord) {
        this.ctx.fillText(content, left, top)
        this.drawTextLine(left, top, textDecoration, color, fontSize, content)
      } else {
        let fillText = ''
        let fillTop = top
        let lineNum = 1
        for (let i = 0; i < content.length; i++) {
          fillText += [content[i]]
          if (this.ctx.measureText(fillText).width > width) {
            if (lineNum === MaxLineNumber) {
              if (i !== content.length) {
                fillText = fillText.substring(0, fillText.length - 1) + '...'
                this.ctx.fillText(fillText, left, fillTop)
                this.drawTextLine(left, fillTop, textDecoration, color, fontSize, fillText)
                fillText = ''
                break
              }
            }
            this.ctx.fillText(fillText, left, fillTop)
            this.drawTextLine(left, fillTop, textDecoration, color, fontSize, fillText)
            fillText = ''
            fillTop += lineHeight
            lineNum ++
          }
        }
        this.ctx.fillText(fillText, left, fillTop)
        this.drawTextLine(left, fillTop, textDecoration, color, fontSize, fillText)
      }
      
      this.ctx.restore()

      if (bolder) {
        this.drawText({
          ...params,
          left: left + 0.3,
          top: top + 0.3,
          bolder: false,
          textDecoration: 'none' 
        })
      }
    },
    drawTextLine (left, top, textDecoration, color, fontSize, content) {
      if (textDecoration === 'underline') {
        this.drawRect({
          background: color,
          top: top + fontSize * 1.2,
          left: left - 1,
          width: this.ctx.measureText(content).width + 3,
          height: 1
        })
      } else if (textDecoration === 'line-through') {
        this.drawRect({
          background: color,
          top: top + fontSize * 0.6,
          left: left - 1,
          width: this.ctx.measureText(content).width + 3,
          height: 1
        })
      }
    },
    drawRect (params) {
      this.ctx.save()
      const { background, top = 0, left = 0, width = 0, height = 0 } = params
      this.ctx.setFillStyle(background)
      this.ctx.fillRect(left, top, width, height)
      this.ctx.fill()
      this.ctx.restore()
    },
    getImageInfo (url) {
      
      return new Promise((resolve, reject) => {
        if (this.cache[url]) {
          wx.showLoading({
            title: url+'在缓存中找到',
          })
          resolve(this.cache[url])
        } else {
          const objExp = new RegExp(/^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/)
          if (objExp.test(url)) {
            // wx.getImageInfo({
              wx.downloadFile({
              url: url,
              success:res=>{
                this.cache[url] = res.tempFilePath
                resolve(res.tempFilePath)
              },
              fail:err=>{
                console.log('err',err)
                this.triggerEvent('getImage', {errMsg: 'canvasdrawer:download fail '+err.errMsg+(url)})
                  reject(new Error('getImageInfo fail '+err.errMsg+(url)))
              }
            })
          } else {
            this.cache[url] = url
            resolve(url)
          }
        }
      })
    },
    saveImageToLocal () {
      const { width, height } = this.data
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width,
        height,
        canvasId: 'canvasdrawer',
        success:res=>{
        },
        fail:err=>{
        },
        complete: res => {
          if (res.errMsg === 'canvasToTempFilePath:ok') {
            this.setData({
              showCanvas: false,
              isPainting: false,
              tempFileList: []
            })
            this.triggerEvent('getImage', {tempFilePath: res.tempFilePath, tempFileList:this.data.tempFileList,errMsg: 'canvasdrawer:ok'})
          } else {
            this.triggerEvent('getImage', {errMsg: 'canvasdrawer:fail'})
          }
        }
      }, this)
    }
  }
})
