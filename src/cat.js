export const CAT_STATE = {
  IDLE: 'IDLE',
  BRUSHING: 'BRUSHING',
  ALERT: 'ALERT',
  LOOKING: 'LOOKING',
  BITING: 'BITING'
};

export default class Cat {
  constructor(canvasWidth, canvasHeight) {
    this.width = 240;
    this.height = 240;
    this.x = (canvasWidth - this.width) / 2;
    this.y = (canvasHeight - this.height) / 2 + 50;
    this.state = CAT_STATE.IDLE;
    
    this.alertTimer = 0;
    this.lookTimer = 0;
    this.nextEventTimer = this.getNextEventDelay();
    
    // Load images
    this.images = {};
    this.loadImages();
  }
  
  loadImages() {
    const imageNames = ['brush_idle', 'brush_happy', 'brush_alert', 'brush_looking', 'brush_bite'];
    imageNames.forEach(name => {
      this.images[name] = wx.createImage();
      this.images[name].src = `assets/images/${name}.png`;
    });
  }

  getNextEventDelay() {
    // Random delay between 2 to 5 seconds for the next alert
    return 2000 + Math.random() * 3000;
  }

  update(dt, isBrushing) {
    if (this.state === CAT_STATE.BITING) return;

    if (this.state === CAT_STATE.IDLE || this.state === CAT_STATE.BRUSHING) {
      if (isBrushing) {
        this.state = CAT_STATE.BRUSHING;
      } else {
        this.state = CAT_STATE.IDLE;
      }

      this.nextEventTimer -= dt;
      if (this.nextEventTimer <= 0) {
        this.state = CAT_STATE.ALERT;
        this.alertTimer = 800 + Math.random() * 700; // Warning for 0.8 - 1.5s
      }
    } else if (this.state === CAT_STATE.ALERT) {
      this.alertTimer -= dt;
      if (this.alertTimer <= 0) {
        this.state = CAT_STATE.LOOKING;
        this.lookTimer = 1000 + Math.random() * 1500; // Looking for 1 - 2.5s
      }
    } else if (this.state === CAT_STATE.LOOKING) {
      this.lookTimer -= dt;
      if (this.lookTimer <= 0) {
        this.state = CAT_STATE.IDLE;
        this.nextEventTimer = this.getNextEventDelay();
      }
    }
  }

  render(ctx) {
    ctx.save();
    
    // Map state to image name
    let imageName = 'brush_idle';
    switch (this.state) {
      case CAT_STATE.BRUSHING: imageName = 'brush_happy'; break;
      case CAT_STATE.ALERT: imageName = 'brush_alert'; break;
      case CAT_STATE.LOOKING: imageName = 'brush_looking'; break;
      case CAT_STATE.BITING: imageName = 'brush_bite'; break;
    }
    
    const img = this.images[imageName];
    if (img && img.width > 0) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      // Fallback: draw colored rectangle
      let color = '#CCCCCC';
      switch (this.state) {
        case CAT_STATE.BRUSHING: color = '#99FF99'; break;
        case CAT_STATE.ALERT: color = '#FFFF99'; break;
        case CAT_STATE.LOOKING: color = '#FF9999'; break;
        case CAT_STATE.BITING: color = '#333333'; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    ctx.restore();
  }

  bite() {
    this.state = CAT_STATE.BITING;
  }

  reset() {
    this.state = CAT_STATE.IDLE;
    this.nextEventTimer = this.getNextEventDelay();
  }
}
