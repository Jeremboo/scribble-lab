import {
  TextureLoader, CubeTextureLoader, Raycaster, Vector2, Scene, WebGLRenderer,
  OrthographicCamera, BufferGeometry, BufferAttribute, Mesh, PerspectiveCamera,
  Vector3, ShaderMaterial,
} from 'three';

let rm;
const RayMarcher = function(){

  const tl = new TextureLoader();
  const cl = new CubeTextureLoader();

  function RayMarcher( distance, precision ){
      this.distance = distance || 50;
      this.precision = precision || 0.01;

      // scene setup
      this.scene = new Scene();

      this.renderer = new WebGLRenderer();
      this.renderer.setSize( window.innerWidth, window.innerHeight );
      this.domElement = this.renderer.domElement;

      // used only to render the scene
      this.renderCamera = new OrthographicCamera(-1,1,1,-1,1/Math.pow( 2, 53 ),1);

      // geometry setup
      this.geom = new BufferGeometry();
      this.geom.addAttribute( 'position', new BufferAttribute( new Float32Array([   -1,-1,0, 1,-1,0, 1,1,0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3 ) );
      this.mesh = new Mesh( this.geom, null );
      this.scene.add( this.mesh );

      //some helpers
      this.camera = new PerspectiveCamera( 60, 1, 0.1,1 );
      this.target = new Vector3();

      return this;

  }

  function loadFragmentShader( fragmentUrl, callback ) {
      this.loaded = false;

      var scope = this;
      var req = new XMLHttpRequest();
      req.open( "GET", fragmentUrl );
      req.onload = function (e) {
          scope.setFragmentShader( e.target.responseText, callback );
      };
      req.send();
      return this;
  }

  function setFragmentShader(fs) {
    this.mesh.material = this.material = new ShaderMaterial({
      uniforms : {
        resolution: { type: 'v2', value: new Vector2(this.width, this.height) },
      },
      vertexShader : 'void main() {gl_Position =  vec4( position, 1.0 );}',
      fragmentShader : fs,
    });

    this.loaded = true;
  }

  function setMaterial(material) {
    material.uniforms.resolution = { type: 'v2', value: new Vector2(this.width, this.height) }
    this.mesh.material = this.material = material
    this.update()
    this.loaded = true
  }

  function setTexture(name, url){
    if( this.material == null )
    {
        throw new Error("material not initialised, use setFragmentShader() first.");
    }
    rm.loaded = false;

    var scope = this;
    this.material.uniforms[ name ] = {type:'t', value:null };
    tl.load( url, function(texture){

        scope.material.uniforms[ name ].value = texture;
        scope.material.needsUpdate = true;
        scope.loaded = true;
        texture.needsUpdate = true;

    });
    return this;
  }

  function setCubemap( name, urls ){
    if( this.material == null )
    {
        throw new Error("material not initialised, use setFragmentShader() first.");
    }
    rm.loaded = false;

    var scope = this;
    this.material.uniforms[ name ] = {type:'t', value:null };
    cl.load( urls, function(texture) {
        scope.material.uniforms[ name ].value = texture;
        scope.material.needsUpdate = true;
        scope.loaded = true;
        texture.needsUpdate = true;
    });
  }

  function setUniform( name, type, value ){
    if( this.material == null ) {
      throw new Error("material not initialised, use setFragmentShader() first.");
    }

    this.material.uniforms[ name ] = {type:type, value:value };
    return this;
  }

  function getUniform( name ){
    if( this.material == null ) {
        console.warn("raymarcher.getUniform: material not initialised, use setFragmentShader() first.");
        return null;
    }

    return this.material.uniforms[name];
  }

  function setSize( width, height ){
    this.width = width;
    this.height = height;

    this.renderer.setSize( width, height );

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    if (this.material != null) {
      this.material.uniforms.resolution.value.x = width;
      this.material.uniforms.resolution.value.y = height;
    }
    return this;
  }

  function update() {

  }

  function render(){
    this.update();
    this.renderer.render(this.scene, this.renderCamera);
  }

  const _p = RayMarcher.prototype;
  _p.constructor = RayMarcher;

  _p.loadFragmentShader = loadFragmentShader;
  _p.setFragmentShader = setFragmentShader;
  _p.setMaterial = setMaterial;
  _p.setTexture = setTexture;
  _p.setCubemap = setCubemap;
  _p.setUniform = setUniform;
  _p.getUniform = getUniform;
  _p.setSize = setSize;
  _p.update = update;
  _p.render = render;

  return RayMarcher;
}();

rm = new RayMarcher();
export default rm;
