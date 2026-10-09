import * as THREE from "three";

// Where the cube layer sits on each step (anything not listed = hidden).
//   center - on screen, rotating
//   off    - slid off the right side of the screen
const cubeStates: Record<number, "center" | "off"> = {
  2: "center",
  3: "off",
  4: "off",
  5: "center",
};

export function setupModel() {
  const container = document.getElementById("model");
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(3, 4, 5);
  scene.add(light);

  // Placeholder: swap this for the supercapacitor model later
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.8, 1.8),
    new THREE.MeshStandardMaterial({
      color: 0x4f8cff,
      metalness: 0.3,
      roughness: 0.4,
    }),
  );
  scene.add(cube);

  function resize() {
    const w = container!.clientWidth;
    const h = container!.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(container);
  resize();

  document.addEventListener("stepchange", (event) => {
    const index = (event as CustomEvent<{ index: number }>).detail.index;
    container.dataset.cube = cubeStates[index] ?? "hidden";
  });

  function loop() {
    requestAnimationFrame(loop);
    if (container!.dataset.cube === "hidden") return;
    cube.rotation.x += 0.008;
    cube.rotation.y += 0.012;
    renderer.render(scene, camera);
  }

  loop();
}
