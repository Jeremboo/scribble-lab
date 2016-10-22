/**/ /* ---- CORE ---- */
/**/ let windowWidth = window.innerWidth,
/**/   windowHeight = window.innerHeight,
/**/   canvas = document.createElement('canvas'),
/**/   context = canvas.getContext("2d");
/**/ canvas.id = "canvas";
/**/ canvas.width = window.innerWidth;
/**/ canvas.height = window.innerHeight;
/**/ document.body.appendChild(canvas);
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
