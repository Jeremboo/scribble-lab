import { createTextureFromUrl, createTexture } from '../../utils/webgl';

export default class Texture {
  constructor(context, url, options) {
    this.gl = context;
    this.options = options;

    // Default black texture
    // https://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load/19748905#19748905
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    createTextureFromUrl(this.gl, url, this.options, this.texture).then((texture) => {
      this.texture = texture;
    }).catch((e) => {
      // TODO 2020-06-16 jeremboo: manage the texture loader error
      console.error(e);
    });
  }

  updateImageData(imageData) {
    this.texture = createTexture(this.gl, imageData, this.options, this.texture);
  }
}