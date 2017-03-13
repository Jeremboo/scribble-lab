import { createCanvasTexture } from 'threejs-texture-tool';

// https://codepen.io/Jeremboo/pen/xqrOYd?editors=1000

const canvasTexture = createCanvasTexture({
  name: 'drawer',
  onStart: (props) => {
    const { width, height, context, update } = props;
    const grd = context.createRadialGradient(
      256 * 0.5, 256 * 0.5, 0,
      256 * 0.5, 256 * 0.5, 50,
    );
    grd.addColorStop(0, "green");
    grd.addColorStop(1, "white");
    context.fillStyle = grd;
    // context.fillStyle = 'red';
    context.fillRect(0, 0, 256, 256);
    // context.arc(256 * 0.5, 256 * 0.5, 10, 0, 2 * Math.PI, false);
    // context.fill();
    // context.fillRect(25,25,100,100);
    // context.clearRect(45,45,60,60);
    // context.strokeRect(50,50,50,50);
  },
  onUpdate: (x, y) => {
    /**const { context } = canvasTexture;
    context.beginPath();
    context.fillStyle = '#00ff00';
    context.fill();
    context.closePath();**/
  },
});

document.body.appendChild(canvasTexture.canvas);

const feImage = document.getElementById('image');
feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', canvasTexture.canvas.toDataURL('image/png'));
