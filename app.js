import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let controller;
let boxGLTF;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // AR button
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  // Load your box model
  const loader = new GLTFLoader();
  loader.load('box.glb', function (gltf) {
    boxGLTF = gltf.scene;
  }, undefined, function (error) {
    console.error('Error loading box.glb:', error);
  });

  // Controller for tap events
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

function onSelect() {
  if (!boxGLTF) return;

  const box = boxGLTF.clone();

  // Random scale between 0.1 and 0.5
  const scale = Math.random() * 0.4 + 0.1;
  box.scale.set(scale, scale, scale);

  // Position the box at the controller's position + a bit forward
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  const position = new THREE.Vector3();
  position.setFromMatrixPosition(controller.matrixWorld);

  // Move box 0.5 meters in front of the controller
  const forward = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix);
  position.add(forward.multiplyScalar(0.5));

  box.position.copy(position);

  scene.add(box);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  renderer.render(scene, camera);
}
