function onSelect() {
  if (!boxGLTF) return;

  // Clone the box for placement
  const box = boxGLTF.clone();
  const targetScale = 0.2; // default small scale
  box.scale.set(targetScale, targetScale, targetScale);

  // Position box at reticle or in front of controller
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

  // Try to find the lid by name
  let lid = box.getObjectByName('lid');
  if (!lid) {
    console.warn('Lid not found! Attempting to find first child object...');
    lid = box.children.find(child => child.name.toLowerCase().includes('lid'));
  }

  if (lid) {
    let progress = 0;
    const maxAngle = Math.PI / 2; // 90 degrees
    const axis = 'y'; // change to 'y' or 'z' if lid opens wrong

    function animateLid() {
      if (progress < 1) {
        progress += 0.03;
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        lid.rotation[axis] = -maxAngle * eased;
        requestAnimationFrame(animateLid);
      }
    }
    animateLid();
  } else {
    console.error('No lid object found in the box GLB.');
  }
}
