/**
 * SurfaceAnimation animate Node elements on the X and Y axis
 * @version 1.0.0
 * @update 2017.12.11
 * @author jeremboo http://jeremieboulay.fr
 *
 * @example
 * const surfaceAnimation = new SurfaceAnimation(
 *    [
 *     '---------------',
 *     '  Surface      ',
 *     '     Animation ',
 *     '---------------',
 *    ],
 *    document.getElementById('wrapper'),
 *    { duration: 2 } ,
 * );
 * // Init an helper to visualize the threshold surface
 * surfaceAnimation.initHelper();
 * // Set the animation values (the thresholds)
 * surfaceAnimation.setThresholdSurface((idx2) => {
 *   return ((idx2.x / surfaceAnimation.width) * 0.5) + ((idx2.y / surfaceAnimation.height) * 0.5);
 * });
 * // Update style of some cells
 * surfaceAnimation.parseCellSurface((cell, idx2) => {
 *   if (idx2.x < 4 || idx2.x > surfaceAnimation.width - 5) {
 *     cell.style.color = '#dd0958'
 *   }
 * });
 * // Add an animation rule
 * surfaceAnimation.addRule((threshold, cell, t) => {
 *   const value = cell.getAttribute('data-content')
 *   if (t >= threshold) {
 *     cell.innerHTML = value
 *   }
 * });
 * surfaceAnimation.play();
 *
 */

import { canvasBuilder } from 'utils'


export default class SurfaceAnimation {
  /**
  * Surface animation
  * @type {Array} caracters .......... An array of strings with the same length who contains the animated matrix.
  * @type {Node} wrapper ............. The wrapper wich will contains the caracters
  * @type {Object} properties ........ Multiple properties
  * */
  constructor(caracters, wrapper, { duration = 1 } = {}) {
    this.caracters = caracters;
    this.duration = duration * 60; // duration in second per frame
    this.wrapper = wrapper;
    this.wrapper.classList.add('SurfaceAnimation');
    this.width = caracters[0].length;
    this.height = caracters.length;
    this.instance = this.width * this.height;

    this.timer = 0;
    this.surfaceCells = [];
    this.surfaceThreshold = [];
    this.rules = f => f;

    // HELPER
    this.cbHelper = false;

    // Buid DOM and the surface matrix
    this._buildSurface()

    // Bind
    this.loop = this.loop.bind(this)
    this.update = this.update.bind(this)
  }

  /**
   * Inject the caracters into the dom and create the matrices
   */
  _buildSurface() {
    let x, y;
    for (y = 0; y < this.height; y++) {
      // init the new animation line
      const animationLine = [];
      // init the new the cellLine
      const p = document.createElement('p');
      const line = [...this.caracters[y]];
      const cellLine = [];
      for (x = 0; x < this.width; x++) {
        // init the new caracter animation
        animationLine.push(0);
        // init the new cell
        const span = document.createElement('span');
        span.setAttribute('data-content', line[x]);
        p.appendChild(span);
        cellLine.push(span);
      }
      // inject
      this.wrapper.appendChild(p);
      this.surfaceCells.push(cellLine);
      this.surfaceThreshold.push(animationLine);
    }
  }

  /**
  * *********
  * PARSING
  * *********
  */

  /**
   * [_parse description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  _parse(callback) {
    let x, y;
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        callback(x, y)
      }
    }
  }

  /**
   * Parse Cell
   * @param  {Function} callback ... handle cell
   */
  parseCellSurface(callback) {
    this._parse((x, y) => {
      callback(this.surfaceCells[y][x], { x, y })
    })
  }

  /**
  * *********
  * SET THRESHOLD
  * *********
  */

  /**
   * Parse the surface animation matrix
   * @param  {Function} callback [description]
   */
  setThresholdSurface(callback) {
    this._parse((x, y) => {
      const v = callback({ x, y });
      this.surfaceThreshold[y][x] = Math.max(0, Math.min(1, v));
    });

    if (this.cbHelper) {
      this._updateHelper();
    }
  }

  /**
   * [setThresholdSurfaceFromImage description]
   * @param {[type]} image [description]
   */
  setThresholdSurfaceFromImage(image) {
    // TODO build canvas and inject into animation
  }

  /**
  * *********
  * RULES
  * *********
  */

  /**
   * Set a callback of rules who will be executed for each update
   * @type {Array}  thresholdData ... [r, g, b, a] values [0 => 1]
   * @type {Node}   cell ........ DOM attribute
   * @type {Number} t ........... the easing position. [0 => 1]
   */
  setRules(callback) {
    if (typeof callback !== 'function') {
      console.error('ERROR: rules must be wrapped into a function');
    }
    this.rules = callback;
  }

  /**
   * *********
   * ANIMATION UPDATE
   * *********
   */

  /**
   * Start the animation
   */
  play() {
    this.timer = 0;
    this.loop()
  }

  loop() {
    this.timer += 1
    this.update();
    if (this.timer <= this.duration) {
      requestAnimationFrame(this.loop);
    }
  }

  update() {
    const t = this.timer / this.duration;

    this._parse((x, y) => {
      const threshold = this.surfaceThreshold[y][x];
      const cell = this.surfaceCells[y][x];
      this.rules(threshold, cell, t)
    });
  }

  /**
  * *********
  * HELPERS
  * *********
  */

  initHelper() {
    this.cbHelper = canvasBuilder(this.width, this.height);
    this.cbHelper.canvas.classList.add('SurfaceAnimation-helper')
    this.cbHelper.imageData = this.cbHelper.context.getImageData(0, 0, this.width, this.height)
    this._updateHelper();
    document.body.appendChild(this.cbHelper.canvas);
  }

  /**
   * Set values between 0 and 1 for each data
   * @param {Function} callback [description]
   */
  _updateHelper() {
    let i4 = 0;

    this._parse((x, y) => {
      this.cbHelper.imageData.data[i4 + 0] = this.surfaceThreshold[y][x] * 255
      this.cbHelper.imageData.data[i4 + 1] = this.surfaceThreshold[y][x] * 255
      this.cbHelper.imageData.data[i4 + 2] = this.surfaceThreshold[y][x] * 255
      this.cbHelper.imageData.data[i4 + 3] = 255
      i4 += 4;
    })
    this.cbHelper.context.putImageData(this.cbHelper.imageData, 0, 0);
  }
}
