import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let controller;
let boxGLTF;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
  scene.add(light);

  const loader = new GLTFLoader();
  loader.load('box-lid.glb', function (gltf) {
    boxGLTF = gltf.scene;
  }, undefined, function (error) {
    console.error('Error loading box-lid.glb:', error);
  });

  // Reticle to show placement
  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.12, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  window.addEventListener('resize', onWindowResize, false);
}

function onSelect(event) {
  if (!boxGLTF) return;

  const box = boxGLTF.clone();
  box.scale.set(0.2, 0.2, 0.2);

  // Position box at reticle if available, else 0.5m in front
  if (reticle.visible) {
    box.position.setFromMatrixPosition(reticle.matrix);
  } else {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    const position = new THREE.Vector3();
    position.setFromMatrixPosition(controller.matrixWorld);
    const forward = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix);
    position.add(forward.multiplyScalar(0.5));
    box.position.copy(position);
  }

  // Optional pop-in animation
  box.scale.set(0.01, 0.01, 0.01);
  const targetScale = 0.2;
  let scaleProgress = 0;
  function animatePop() {
    if (scaleProgress < 1) {
      scaleProgress += 0.05;
      const eased = easeOutBack(scaleProgress);
      box.scale.set(targetScal
