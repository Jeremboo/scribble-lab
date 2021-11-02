import { Vector2 } from 'three';


// TODO 2021-11-02 jeremboo: Create a global Pass.three.js file
export default class PostProcessingPass {
  constructor() {

    this.uniforms = {
      mousePosition: { value: new Vector2() }
    };

    this.fragmentUniforms = `
    uniform vec2 mousePosition;
`;
    this.fragmentMain = `
`;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e) {
    const x = e.x / window.innerWidth;
    const y = e.y / window.innerHeight;
    this.uniforms.mousePosition.value.x = x;
    this.uniforms.mousePosition.value.y = y;
  }

  // update() {
  //   // NOTE 2021-11-02 jeremboo: No update loop for now
  // }
}