

const WIDTH = 512;
const HEIGHT = 256;

class AudioCanvas {
  constructor(nbrOfBars = 64) {
    this.t = 0;
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('texture');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    document.body.appendChild(this.canvas);

    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.bars = [];
    this.barWidth = WIDTH / nbrOfBars;

    for (let i = 0; i < nbrOfBars ; i++) {
      this.bars.push({
        startAt: Math.PI * Math.random(),
        main: Math.floor(Math.min(HEIGHT * 0.9, Math.random() * HEIGHT)),
        second: Math.floor(Math.max(10, Math.random() * HEIGHT * 0.6)),
      });
    }
  }

  update() {
    this.t += 0.05;
  }

  render() {
    this.context.clearRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < this.bars.length; i++) {
      this.bars[i].main += Math.sin(this.t + this.bars[i].startAt);
      this.bars[i].second = Math.max(10, this.bars[i].second + Math.sin(this.t + this.bars[i].startAt) * 0.2);
      const { main, second } = this.bars[i];
      this.context.beginPath();
      this.context.fillStyle = "#000000";
      this.context.rect(i * this.barWidth, HEIGHT, this.barWidth, -main);
      this.context.fill();
      this.context.beginPath();
      this.context.fillStyle = "#ffffff";
      this.context.rect(i * this.barWidth, HEIGHT, this.barWidth, -second);
      this.context.fill();
    }
  }

}

export default AudioCanvas;