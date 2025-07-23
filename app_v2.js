import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { ARButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js';


let camera, scene, renderer, controller;
let boxGLTF;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer));

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  const loader = new GLTFLoader();
  loader.load('box.glb', gltf => {
    boxGLTF = gltf.scene;
  });

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}

function onSelect() {
  if (!boxGLTF) return;

  const box = boxGLTF.clone();

  const scale = Math.random() * 0.4 + 0.1;
  box.scale.set(scale, scale, scale);

  box.position.set(
    controller.position.x,
    controller.position.y + 1,
    controller.position.z
  );

  scene.add(box);
}
