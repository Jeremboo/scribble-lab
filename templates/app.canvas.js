/**/ /* ---- CORE ---- */
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ let windowWidth = canvas.width = window.innerWidth;
/**/ let windowHeight = canvas.height = window.innerHeight;
/**/ canvas.id = 'canvas';
/**/ document.body.insertBefore(canvas, document.body.firstChild);
/**/ window.onresize = () => {
/**/   windowWidth = canvas.width = window.innerWidth;
/**/   windowHeight = canvas.height = window.innerHeight;
/**/ };
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */


class ExempleCanvasItem {
  // Save state here
  constructor() {}

  // Update values here
  update() {}

  render() {
    context.beginPath();
    // draw Something Here
    context.stroke();
    context.fill();
  }
}

let exempleCI = new ExempleCanvasItem();

function loop() {
  exempleCI.update();
  exempleCI.render();
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   context.clearRect(0,0, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
