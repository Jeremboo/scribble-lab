import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading,

  ShaderChunk, RepeatWrapping,
  AdditiveBlending, DoubleSide, BufferAttribute, BufferGeometry,
  ShaderMaterial, Points,
} from 'three';

import OrbitControls from 'OrbitControl';
import GPUComputationRenderer from 'GPUComputationRenderer';

// https://codepen.io/timseverien/pen/VbGqdv?editors=1010

import shaderSimulationPosition from './shaders/simulationPosition.v.glsl';
import shaderSimulationVelocity from './shaders/simulationVelocity.v.glsl';

// INIT
const TEXTURE_SIZE = 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;

let previousFrame = Date.now() / 1000;

const cameraFar = Math.pow(2, 16);
const camera = new PerspectiveCamera(45, 1, 0.001, cameraFar);
camera.position.z = 8;

const scene = new Scene();
const renderer = new WebGLRenderer({
	antialias: true,
});

renderer.setPixelRatio(window.devicePixelRatio);

const controls = new OrbitControls(camera, renderer.domElement);

// PARTICLES
const shaderPointFragment = `
void main() {
	gl_FragColor = vec4(1.0, 0.25, 0.0, 1.0);
}`;

const shaderPointVertex = `
attribute vec2 reference;
uniform sampler2D texturePosition;

void main() {
	vec3 position = texture2D(texturePosition, reference).xyz;

	${ShaderChunk.begin_vertex}
	${ShaderChunk.project_vertex}

	gl_PointSize = 8.0 * (1.0 / -mvPosition.z);
}`;

const particles = ((points) => {
	const vertices = new Float32Array(points * 3).fill(0);
	const references = new Float32Array(points * 2);

	for (let i = 0; i < references.length; i += 2) {
		const indexVertex = i / 2;

		references[i] = (indexVertex % TEXTURE_WIDTH) / TEXTURE_WIDTH;
		references[i + 1] = Math.floor(indexVertex / TEXTURE_WIDTH) / TEXTURE_HEIGHT;
	}

	const geometry = new BufferGeometry();
	geometry.addAttribute('position', new BufferAttribute(vertices, 3));
	geometry.addAttribute('reference', new BufferAttribute(references, 2));

	const material = new ShaderMaterial({
		uniforms: {
			texturePosition: { value: null },
		},
		fragmentShader: shaderPointFragment,
		vertexShader: shaderPointVertex,
		side: DoubleSide,
		blending: AdditiveBlending,
		transparent: true,
	});

	return new Points(geometry, material);
})(TEXTURE_WIDTH * TEXTURE_HEIGHT);

scene.add(particles);

// GPUComputationRenderer

const gpuComputationRenderer = new GPUComputationRenderer(TEXTURE_WIDTH, TEXTURE_HEIGHT, renderer);

const dataPosition = gpuComputationRenderer.createTexture();
const dataVelocity = gpuComputationRenderer.createTexture();
const textureArraySize = TEXTURE_WIDTH * TEXTURE_HEIGHT * 4;

const birandom = () => Math.random() * 2 - 1;

for (let i = 0; i < textureArraySize; i += 4) {
	const radius = (1 - Math.pow(Math.random(), 3)) * 1;
	const azimuth = Math.random() * Math.PI;
	const inclination = Math.random() * Math.PI * 2;

	dataPosition.image.data[i] = radius * Math.sin(azimuth) * Math.cos(inclination);
	dataPosition.image.data[i + 1] = radius * Math.sin(azimuth) * Math.sin(inclination);
	dataPosition.image.data[i + 2] = radius * Math.cos(azimuth);
	dataPosition.image.data[i + 3] = 1;

	dataVelocity.image.data[i] = 0;
	dataVelocity.image.data[i + 1] = 0;
	dataVelocity.image.data[i + 2] = 0;
	dataVelocity.image.data[i + 3] = 1;
}

const variableVelocity = gpuComputationRenderer
	.addVariable('textureVelocity', shaderSimulationVelocity, dataVelocity);
const variablePosition = gpuComputationRenderer
	.addVariable('texturePosition', shaderSimulationPosition, dataPosition);

variablePosition.material.uniforms.delta = { value: 0 };

gpuComputationRenderer
	.setVariableDependencies(variableVelocity, [ variableVelocity, variablePosition ]);
gpuComputationRenderer
	.setVariableDependencies(variablePosition, [ variableVelocity, variablePosition ]);

variablePosition.wrapS = RepeatWrapping;
variablePosition.wrapT = RepeatWrapping;
variableVelocity.wrapS = RepeatWrapping;
variableVelocity.wrapT = RepeatWrapping;

const gpuComputationRendererError = gpuComputationRenderer.init();

if (gpuComputationRendererError) {
	console.error('ERROR', gpuComputationRendererError);
}

// Resize
const resize = (
	width = window.innerWidth,
	height = window.innerHeight
) => {
	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
};

const render = (delta) => {
	gpuComputationRenderer.compute();

	variablePosition.material.uniforms.delta.value = Math.min(delta, 0.5);

	particles.material.uniforms.texturePosition.value = gpuComputationRenderer
		.getCurrentRenderTarget(variablePosition).texture;

	renderer.render(scene, camera);
};

const animate = () => {
	requestAnimationFrame(animate);

	const now = Date.now() / 1000;
	const delta = now - previousFrame;
	previousFrame = now;

	render(delta);
};

document.body.appendChild(renderer.domElement);
window.addEventListener('resize', () => resize());

resize();
animate();
