import * as THREE from "three";

// Where the model layer sits on each step (anything not listed = hidden).
//   center - on screen, rotating
//   off    - slid off the right side of the screen
const cubeStates: Record<number, "center" | "off"> = {
  2: "center",
  3: "off",
  4: "off",
  5: "off",
  6: "center",
};

const R = 1.1; // cell radius

// Bottom to top. t = thickness.
const layers = [
  { label: "Bottom case (−)", t: 0.12, kind: "case", pin: -1 },
  { label: "Current collector", t: 0.06, kind: "collector", pin: 0 },
  { label: "Carbon electrode", t: 0.3, kind: "carbon", pin: 0 },
  { label: "Separator + electrolyte", t: 0.08, kind: "separator", pin: 0 },
  { label: "Carbon electrode", t: 0.3, kind: "carbon", pin: 0 },
  { label: "Current collector", t: 0.06, kind: "collector", pin: 0 },
  { label: "Top case (+)", t: 0.12, kind: "case", pin: 1 },
];

const materials: Record<string, THREE.MeshStandardMaterial> = {
  case: new THREE.MeshStandardMaterial({ color: 0x8a8f99, metalness: 0.7, roughness: 0.3 }),
  collector: new THREE.MeshStandardMaterial({ color: 0xd5d9e0, metalness: 0.9, roughness: 0.25 }),
  carbon: new THREE.MeshStandardMaterial({ color: 0x1b1b22, metalness: 0.1, roughness: 0.9 }),
  separator: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.5,
  }),
  pin: new THREE.MeshStandardMaterial({ color: 0xd9b44a, metalness: 0.8, roughness: 0.3 }),
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function setupModel() {
  const container = document.getElementById("model");
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.6, 9);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1));
  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(3, 4, 5);
  scene.add(light);

  const cell = new THREE.Group();
  scene.add(cell);

  // ---- Build the parts ----
  const total = layers.reduce((sum, l) => sum + l.t, 0);

  type Part = { group: THREE.Group; closedY: number; openY: number; label: HTMLDivElement };
  const parts: Part[] = [];
  const ions: THREE.Mesh[] = [];

  let y = -total / 2;
  layers.forEach((layer, i) => {
    const group = new THREE.Group();

    const radius = layer.kind === "case" ? R + 0.04 : R;
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, layer.t, 48),
      materials[layer.kind],
    );
    group.add(disc);

    // Thin outline so each layer stands out
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(disc.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }),
    );
    group.add(edges);

    // Terminal pins on the two case plates
    if (layer.pin !== 0) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 24), materials.pin);
      pin.position.y = layer.pin * (layer.t / 2 + 0.15);
      group.add(pin);
    }

    // Ions floating in the separator (red = +, blue = −)
    if (layer.kind === "separator") {
      for (let n = 0; n < 36; n++) {
        const positive = n % 2 === 0;
        const ion = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 12, 12),
          new THREE.MeshStandardMaterial({
            color: positive ? 0xff4f5e : 0x4f8cff,
            emissive: positive ? 0x551018 : 0x102a55,
          }),
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * R * 0.9;
        ion.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        ion.userData.phase = Math.random() * Math.PI * 2;
        group.add(ion);
        ions.push(ion);
      }
    }

    cell.add(group);

    const label = document.createElement("div");
    label.className = "part-label";
    label.textContent = layer.label;
    container.appendChild(label);

    parts.push({
      group,
      closedY: y + layer.t / 2,
      openY: -2.1 + i * 0.7,
      label,
    });
    y += layer.t;
  });

  // The metal can around everything: fades away when opened
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x8a8f99,
    metalness: 0.7,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.04, R + 0.04, total, 48, 1, true),
    tubeMat,
  );
  cell.add(tube);

  // ---- Open / close ----
  let progress = 0; // 0 = closed, 1 = fully opened
  let target = 0;

  document.addEventListener("keydown", (event) => {
    if (container.dataset.cube !== "center") return;
    if (event.key === "ArrowUp") {
      target = 1;
      event.preventDefault();
    }
    if (event.key === "ArrowDown") {
      target = 0;
      event.preventDefault();
    }
  });

  let startX = 0;
  let startY = 0;
  document.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    },
    { passive: true },
  );
  document.addEventListener("touchend", (event) => {
    if (container.dataset.cube !== "center") return;
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50) return;
    if (dy < -50) target = 1;
    if (dy > 50) target = 0;
  });

  // ---- Sizing ----
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
    target = 0; // always start closed
  });

  // ---- Animation loop ----
  const anchor = new THREE.Vector3();
  let time = 0;

  function loop() {
    requestAnimationFrame(loop);
    if (container!.dataset.cube === "hidden") return;

    time += 0.03;
    progress += (target - progress) * 0.06;
    if (Math.abs(target - progress) < 0.001) progress = target;
    const e = smooth(0, 1, progress);

    cell.rotation.y += 0.008;

    parts.forEach((part) => {
      part.group.position.y = part.closedY + (part.openY - part.closedY) * e;
    });

    const tubeOpacity = 1 - smooth(0, 0.4, progress);
    tubeMat.opacity = tubeOpacity;
    tube.visible = tubeOpacity > 0.01;

    ions.forEach((ion) => {
      ion.position.y = Math.sin(time + ion.userData.phase) * 0.025;
    });

    // Labels sit to the right of each layer and fade in once opened
    const w = container!.clientWidth;
    const h = container!.clientHeight;
    const labelOpacity = smooth(0.6, 1, progress);
    parts.forEach((part) => {
      anchor.set(1.8, part.group.position.y, 0).project(camera);
      const px = (anchor.x * 0.5 + 0.5) * w;
      const py = (-anchor.y * 0.5 + 0.5) * h;
      part.label.style.transform = `translate(${px}px, ${py}px) translateY(-50%)`;
      part.label.style.opacity = String(labelOpacity);
    });

    renderer.render(scene, camera);
  }

  loop();
}