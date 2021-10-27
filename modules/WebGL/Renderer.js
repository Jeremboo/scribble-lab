
/**
 * Used to loop the Program in the most performant way
 */
export default class Renderer {
  constructor(context) {
    this.gl = context;
    this.i = 0;
    this.programs = [];
    this.programCount = -1;
    this.programLastUsed = false;

    this.render = this.render.bind(this);
  }

  /**
   * * *******************
   * * PROGRAM
   * * *******************
   */

  addProgram(program) {
    this.programCount++;
    this.programs.unshift(program);
  }
  removeProgram(program) {
    // TODO 2020-05-31 jeremboo:
  }

  /**
   * * *******************
   * * RENDER
   * * *******************
   */

  // TODO 2020-06-18 jeremboo: Improve it
  // TODO 2020-06-21 jeremboo: pass the camera as a props there?
  render() {
    for(this.i = this.programCount; this.i >= 0; this.i--) {
      if (this.programLastUsed !== this.programs[this.i].id) {
        this.programs[this.i].useProgram();
        this.programLastUsed = this.programs[this.i].id;
      }
      // TODO what is the difference between drawArrays and drawElements?
      // this.gl.drawArrays(this.gl.TRIANGLES, 0, this.programs[this.i].count);
      this.gl.drawElements(this.gl.TRIANGLES, this.programs[this.i].count, this.gl.UNSIGNED_SHORT, 0);
    }
  }
}