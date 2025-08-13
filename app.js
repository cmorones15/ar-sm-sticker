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
  box.scale.set(0.01, 0.01, 0.01);

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

  scene.add(box);

  const targetScale = 0.2;
  let scaleProgress = 0;
  function animatePop() {
    if (scaleProgress < 1) {
      scaleProgress += 0.05;
      const eased = easeOutBack(scaleProgress);
      box.scale.set(targetScale * eased, targetScale * eased, targetScale * eased);
      requestAnimationFrame(animatePop);
    }
  }
  animatePop();

  const lid = box.getObjectByName('lid');
  if (lid) {
    let openProgress = 0;
    const maxAngle = Math.PI / 2;
    function animateLid() {
      if (openProgress < 1) {
        openProgress += 0.03;
        const eased = easeOutCubic(openProgress);
        lid.rotation.x = -maxAngle * eased;
        requestAnimationFrame(animateLid);
      }
    }
    animateLid();
  }
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const session = renderer.xr.getSession();

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          hitTestSource = source;
        });
      });

      session.addEventListener('end', () => {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });

      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}
