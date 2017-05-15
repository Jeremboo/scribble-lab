import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading,
  NearestFilter, RGBFormat, FloatType, WebGLRenderTarget, BufferGeometry, BufferAttribute,
  ShaderMaterial, DataTexture, Points, OrthographicCamera, AdditiveBlending,
} from 'three';

var FBO = function( exports ){

    var scene, orthoCamera, rtt;
    exports.init = function( width, height, renderer, simulationMaterial, renderMaterial ){

        var gl = renderer.getContext();

        //1 we need FLOAT Textures to store positions
        //https://github.com/KhronosGroup/WebGL/blob/master/sdk/tests/conformance/extensions/oes-texture-float.html
        if (!gl.getExtension("OES_texture_float")){
            throw new Error( "float textures not supported" );
        }

        //2 we need to access textures from within the vertex shader
        //https://github.com/KhronosGroup/WebGL/blob/90ceaac0c4546b1aad634a6a5c4d2dfae9f4d124/conformance-suites/1.0.0/extra/webgl-info.html
        if( gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) == 0 ) {
            throw new Error( "vertex shader cannot read textures" );
        }

        //3 rtt setup
        scene = new Scene();
        orthoCamera = new OrthographicCamera(-1,1,1,-1,1/Math.pow( 2, 53 ),1 );

        //4 create a target texture
        var options = {
            minFilter: NearestFilter,//important as we want to sample square pixels
            magFilter: NearestFilter,//
            format: RGBFormat,//could be RGBAFormat
            type:FloatType//important as we need precise coordinates (not ints)
        };
        rtt = new WebGLRenderTarget( width,height, options);


        //5 the simulation:
        //create a bi-unit quadrilateral and uses the simulation material to update the Float Texture
        var geom = new BufferGeometry();
        geom.addAttribute( 'position', new BufferAttribute( new Float32Array([   -1,-1,0, 1,-1,0, 1,1,0, -1,-1, 0, 1, 1, 0, -1,1,0 ]), 3 ) );
        geom.addAttribute( 'uv', new BufferAttribute( new Float32Array([   0,1, 1,1, 1,0,     0,1, 1,0, 0,0 ]), 2 ) );
        scene.add( new Mesh( geom, simulationMaterial ) );

        //6 the particles:
        //create a vertex buffer of size width * height with normalized coordinates
        var l = (width * height );
        var vertices = new Float32Array( l * 3 );
        for ( var i = 0; i < l; i++ ) {

            var i3 = i * 3;
            vertices[ i3 ] = ( i % width ) / width ;
            vertices[ i3 + 1 ] = ( i / width ) / height;
        }

        //create the particles geometry
        var geometry = new BufferGeometry();
        geometry.addAttribute( 'position',  new BufferAttribute( vertices, 3 ) );

        //the rendermaterial is used to render the particles
        exports.particles = new Points( geometry, renderMaterial );
        exports.renderer = renderer;

    };

    //7 update loop
    exports.update = function(){

        //1 update the simulation and render the result in a target texture
        exports.renderer.render( scene, orthoCamera, rtt, true );

        //2 use the result of the swap as the new position for the particles' renderer
        exports.particles.material.uniforms.positions.value = rtt;

    };
    return exports;
}({});

var scene, camera, renderer;

window.onload = function() {
    init();
};

function init()
{


    var w = window.innerWidth;
    var h = window.innerHeight;

    //regular scene creation
    scene = new Scene();
    camera = new PerspectiveCamera(60,w/h, 1,10000 );
    camera.position.z = 500;

    renderer = new WebGLRenderer();
    renderer.setSize( w,h );
    document.body.appendChild(renderer.domElement);

    //width / height of the FBO

    var width  = 256;
    var height = 256;

    //populate a Float32Array of random positions

    var data = getRandomData( width, height, 256 );
    var positions = new DataTexture( data, width, height, RGBFormat, FloatType );
    positions.needsUpdate = true;

    //this will be used to update the particles' positions

    var simulationShader = new ShaderMaterial({
      uniforms: { positions: { type: 't', value: positions } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = vec2(uv.x, uv.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D positions;
        varying vec2 vUv;
        void main() {
            vec3 pos = texture2D( positions, vUv ).rgb;
            gl_FragColor = vec4( pos,1.0 );
        }
      `,
    });


    //this will be used to represent the particles on screen
    //note that 'positions' is a texture that will be set and updated during the FBO.update() call
    var renderShader = new ShaderMaterial({
      uniforms: {
        positions: { type: 't', value: null },
        pointSize: { type: 'f', value: 2 },
      },
      vertexShader: `
        uniform sampler2D positions; // RenderTarget containing the transformed positions
        uniform float pointSize;
        void main() {
          //the mesh is a nomrliazed square so the uvs = the xy positions of the vertices
          vec3 pos = texture2D( positions, position.xy ).xyz;
          //pos now contains a 3D position in space, we can use it as a regular vertex

          //regular projection of our position
          gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

          //sets the point size
          gl_PointSize = pointSize;
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4( vec3( 1. ), .25 );
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
    });

    //init the FBO
    FBO.init( width,height, renderer, simulationShader, renderShader );
    scene.add( FBO.particles );

    //GO !
    window.addEventListener( "resize", onResize );
    onResize();
    update();

}

//returns an array of random 3D coordinates
function getRandomData( width, height, size ){

    var len = width * height * 3;
    var data = new Float32Array( len );
    while( len-- )data[len] = ( Math.random() -.5 ) * size ;
    return data;
}

function onResize()
{
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w,h);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
}

//update loop
function update()
{
    requestAnimationFrame(update);

    //update the simulation
    FBO.update();

    //update mesh
    FBO.particles.rotation.x += Math.PI / 180 * .5;
    FBO.particles.rotation.y -= Math.PI / 180 * .5;

    //render the particles at the new location
    renderer.render( scene, camera );

}
