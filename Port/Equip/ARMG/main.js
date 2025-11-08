import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js?module";
import { ARMGCrane } from "./armg.js";
var aaa = 0;
const containerSize = { length: 6.1, height: 2.59, width: 2.44 };
const containerGap = 0.25;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1018);
scene.fog = new THREE.Fog(0x0c1018, 80, 180);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const sceneElement = document.getElementById("scene");
sceneElement.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
camera.position.set(-34, 20, 34);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(8, 6, 0);
controls.update();

const resizeRenderer = () => {
  const width = sceneElement.clientWidth || sceneElement.offsetWidth || window.innerWidth;
  const height = sceneElement.clientHeight || sceneElement.offsetHeight || Math.max(window.innerHeight * 0.6, 480);
  if (width === 0 || height === 0) return;
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(window.devicePixelRatio);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

resizeRenderer();
window.addEventListener("resize", resizeRenderer);

const ambientLight = new THREE.HemisphereLight(0xd1e4ff, 0x20242b, 0.75);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(-26, 40, 22);
sunLight.castShadow = true;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 120;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -40;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2531, roughness: 0.9, metalness: 0.1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const createAxes = (length) => {
  const group = new THREE.Group();

  // X轴 - 红色
  const xGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(length, 0, 0)]);
  const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const xLine = new THREE.Line(xGeometry, xMaterial);
  group.add(xLine);

  // Y轴 - 黄色
  const yGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0)]);
  const yMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
  const yLine = new THREE.Line(yGeometry, yMaterial);
  group.add(yLine);

  // Z轴 - 蓝色
  const zGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, length)]);
  const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const zLine = new THREE.Line(zGeometry, zMaterial);
  group.add(zLine);

  return group;
};

const axes = createAxes(5);
axes.position.set(-20, 0.1, -20);
scene.add(axes);

const crane = new ARMGCrane({ railSpan: 40, hoistHeight: 18.2, cantilever: 7.5, trolleyWidth: 6 });
crane.group.rotation.y = Math.PI / 2;
crane.group.position.set(10.8, 0, 4);
scene.add(crane.group);

const createContainer = (color = 0x3366cc) => {
  const geometry = new THREE.BoxGeometry(containerSize.length, containerSize.height, containerSize.width, 1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.65 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const edgeGeometry = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0c1018 });
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  mesh.add(edges);
  return mesh;
};

const containerPalette = [0x2f80ed, 0xf2994a, 0xeb5757, 0x27ae60, 0x9b51e0, 0x56ccf2];
const randomContainerColor = () => {
  const index = Math.floor(Math.random() * containerPalette.length);
  return containerPalette[index];
};

const createAGV = () => {
  const group = new THREE.Group();
  const chassisHeight = 1.2;
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(14, chassisHeight, 3.6), new THREE.MeshStandardMaterial({ color: 0x3c4758, metalness: 0.2, roughness: 0.8 }));
  chassis.position.y = chassisHeight / 2;
  chassis.castShadow = chassis.receiveShadow = true;
  group.add(chassis);

  const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.0, 24);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.4, roughness: 0.4 });

  for (let i = 0; i < 8; i += 1) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(
      -5 + (i % 4) * 3.4,
      0.35,
      i < 4 ? -1.6 : 1.6,
    );
    wheel.castShadow = wheel.receiveShadow = true;
    group.add(wheel);
  }

  return { group, chassisHeight };
};

const agv = createAGV();
agv.group.position.set(10.8, 0, -20);
scene.add(agv.group);

const createYardBlock = () => {
  const yardGroup = new THREE.Group();
  const padHeight = 0.4;
  const pad = new THREE.Mesh(new THREE.BoxGeometry(38, padHeight, 27), new THREE.MeshStandardMaterial({ color: 0x202838, metalness: 0.1, roughness: 0.9 }));
  pad.position.y = padHeight / 2;
  pad.receiveShadow = true;
  yardGroup.add(pad);

  const rows = 10;
  const cols = 6;
  const slotSpacingX = containerSize.length + containerGap; // 6.1 + 0.25 = 6.35
  const slotSpacingZ = containerSize.width + containerGap; // 2.44 + 0.25 = 2.69
  const originX = -((cols - 1) * slotSpacingX) / 2;
  const originZ = -((rows - 1) * slotSpacingZ) / 2;

  const slots = [];
  const initialLayout = [
    [1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [2, 1, 1, 2, 1, 1],
    [1, 1, 2, 1, 1, 2],
    [2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2, 2],
    [3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, 3],
  ];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const localX = originX + col * slotSpacingX;
      const localZ = originZ + row * slotSpacingZ;
      const slot = {
        id: `slot-${row}-${col}`,
        localPosition: new THREE.Vector3(localX, padHeight, localZ),
        stackBaseY: padHeight + containerSize.height / 2,
        containers: [],
        capacity: 4,
      };

      const initialCount = initialLayout[row][col];
      for (let level = 0; level < initialCount; level += 1) {
        const container = createContainer(randomContainerColor());
        container.position.set(localX, slot.stackBaseY + level * (containerSize.height + containerGap), localZ);
        container.userData.originSlot = slot;
        slot.containers.push(container);
        yardGroup.add(container);
      }

      slot.stackHeight = slot.containers.length;
      slot.initialCount = slot.stackHeight;
      slots.push(slot);
    }
  }

  return { group: yardGroup, slots };
};

const yard = createYardBlock();
yard.group.position.set(14, 0, 4);
scene.add(yard.group);

const slots = yard.slots;
let targetSlotIndex = 0;
const pickNextSlot = () => {
  let selected = null;
  let minHeight = Infinity;
  slots.forEach((slot, index) => {
    if (slot.stackHeight < slot.capacity && slot.stackHeight < minHeight) {
      minHeight = slot.stackHeight;
      selected = index;
    }
  });
  if (selected === null) {
    // reset dynamic containers when every slot is full
    slots.forEach((slot) => {
      while (slot.containers.length > slot.initialCount) {
        const container = slot.containers.pop();
        container.parent?.remove(container);
      }
      slot.stackHeight = slot.initialCount;
    });
    minHeight = Infinity;
    slots.forEach((slot, index) => {
      if (slot.stackHeight < slot.capacity && slot.stackHeight < minHeight) {
        minHeight = slot.stackHeight;
        selected = index;
      }
    });
  }
  targetSlotIndex = selected ?? 0;
};

pickNextSlot();

const spreaderBottomOffset = crane.spreaderBottomOffset ?? 1.75;
const depthForSpreaderBottom = (worldY) => Math.max(0, crane.crossbeamElevation - worldY - spreaderBottomOffset);

const travelClearanceDepth = depthForSpreaderBottom(16);
const hoistTopDepth = 0;

const agvContainerTop = agv.chassisHeight + containerSize.height;
const agvPickupDepth = depthForSpreaderBottom(agvContainerTop + 0.1);

const containerHoistOffset = (crane.crossbeamElevation - crane.trolleyGroup.position.y) + Math.abs(crane.spreaderGroup.position.y) + (containerSize.height / 2 + 0.25);
const depthForContainerCenter = (worldY) => Math.max(0, crane.crossbeamElevation - worldY - containerHoistOffset);

let activeContainer = null;
let hoistedContainer = null;
const dynamicContainers = [];

let approachStartX = 0;
let lowerStartDepth = travelClearanceDepth;
let hoistStartDepth = travelClearanceDepth;
let traverseStartX = 0;
let stackLowerStartDepth = travelClearanceDepth;
let raiseStartDepth = travelClearanceDepth;

const spawnContainerOnAgv = () => {
  if (activeContainer) return;
  const container = createContainer(randomContainerColor());
  container.position.set(0, agv.chassisHeight + containerSize.height / 2, 0);
  agv.group.add(container);
  activeContainer = container;
  dynamicContainers.push(container);
};

const clock = new THREE.Clock();
let stateIndex = 0;
let stateElapsed = 0;

const computeSlotLocalPosition = (slot, stackHeight) => {
  const { localPosition, stackBaseY } = slot;
  return new THREE.Vector3(
    localPosition.x,
    stackBaseY + stackHeight * (containerSize.height + containerGap),
    localPosition.z,
  );
};

const computeSlotWorldPosition = (slot, stackHeight) => {
  const local = computeSlotLocalPosition(slot, stackHeight);
  return new THREE.Vector3(
    yard.group.position.x + local.x,
    yard.group.position.y + local.y,
    yard.group.position.z + local.z,
  );
};

const computeTrolleyLocalXFromWorld = (worldPosition) => {
  crane.group.updateMatrixWorld(true);
  const local = worldPosition.clone();
  crane.group.worldToLocal(local);
  return local.x;
};

const computeSlotTargetLocalX = (slot, stackHeight) => computeTrolleyLocalXFromWorld(computeSlotWorldPosition(slot, stackHeight));

const getAgvReferenceWorldPosition = () => {
  agv.group.updateMatrixWorld(true);
  return agv.group.localToWorld(new THREE.Vector3(0, 0, 0));
};

const agvPickupLocalX = computeTrolleyLocalXFromWorld(getAgvReferenceWorldPosition());

const initialStackWorldPosition = computeSlotWorldPosition(slots[targetSlotIndex], slots[targetSlotIndex].stackHeight);
const initialTrolleyLocalX = computeTrolleyLocalXFromWorld(initialStackWorldPosition);

crane.setTrolleyPosition(initialTrolleyLocalX);
crane.setHoistDepth(travelClearanceDepth);
spawnContainerOnAgv();

const animationStates = [
  {
    name: "approach-agv",
    duration: 3,
    onStart: () => {
      approachStartX = crane.trolleyGroup.position.x;
    },
    onUpdate: (t) => {
      const value = THREE.MathUtils.lerp(approachStartX, agvPickupLocalX, t);
      crane.setTrolleyPosition(value);
    },
  },
  {
    name: "lower-to-agv",
    duration: 2,
    onStart: () => {
      lowerStartDepth = crane.hoistGroup.position.y * -1;
    },
    onUpdate: (t) => {
      const depth = THREE.MathUtils.lerp(lowerStartDepth, agvPickupDepth, t);
      crane.setHoistDepth(depth);
    },
  },
  {
    name: "clamp",
    duration: 0.6,
    onStart: () => {
      if (!activeContainer) return;
      hoistedContainer = activeContainer;
      crane.attachContainer(activeContainer);
      activeContainer = null;
    },
  },
  {
    name: "hoist-clear",
    duration: 2.2,
    onStart: () => {
      hoistStartDepth = crane.hoistGroup.position.y * -1;
    },
    onUpdate: (t) => {
      const depth = THREE.MathUtils.lerp(hoistStartDepth, hoistTopDepth, t);
      crane.setHoistDepth(depth);
    },
  },
  {
    name: "traverse-yard",
    duration: 4,
    onStart: () => {
      traverseStartX = crane.trolleyGroup.position.x;
    },
    onUpdate: (t) => {
      const slot = slots[targetSlotIndex];
      const targetLocalX = computeSlotTargetLocalX(slot, slot.stackHeight);
      const value = THREE.MathUtils.lerp(traverseStartX, targetLocalX, t);
      crane.setTrolleyPosition(value);
    },
  },
  {
    name: "lower-to-stack",
    duration: 2.4,
    onStart: () => {
      stackLowerStartDepth = crane.hoistGroup.position.y * -1;
    },
    onUpdate: (t) => {
      const slot = slots[targetSlotIndex];
      const targetPos = computeSlotWorldPosition(slot, slot.stackHeight);
      const targetDepth = depthForContainerCenter(targetPos.y);
      const depth = THREE.MathUtils.lerp(stackLowerStartDepth, targetDepth, t);
      crane.setHoistDepth(depth);
    },
  },
  {
    name: "release",
    duration: 0.6,
    onStart: () => {
      if (!hoistedContainer) return;
      const slot = slots[targetSlotIndex];
      const dropLocal = computeSlotLocalPosition(slot, slot.stackHeight);
      const released = crane.detachContainer(yard.group, dropLocal);
      if (released) {
        released.position.copy(dropLocal);
        released.userData.originSlot = slot;
        slot.containers.push(released);
        slot.stackHeight += 1;
      }
      hoistedContainer = null;
      pickNextSlot();
      aaa=1;
    },
  },
  {
    name: "raise-empty",
    duration: 1.8,
    onStart: () => {
      raiseStartDepth = crane.hoistGroup.position.y * -1;
    },
    onUpdate: (t) => {
      const depth = THREE.MathUtils.lerp(raiseStartDepth, travelClearanceDepth, t);
      crane.setHoistDepth(depth);
    },
  },
  {
    name: "wait",
    duration: 2,
    onStart: () => {},
  },
];

animationStates[stateIndex].onStart?.();

const resetSimulation = () => {
  stateIndex = 0;
  stateElapsed = 0;
  hoistedContainer = null;

  dynamicContainers.forEach((container) => {
    container.parent?.remove(container);
  });
  dynamicContainers.length = 0;
  slots.forEach((slot) => {
    while (slot.containers.length > slot.initialCount) {
      const container = slot.containers.pop();
      container.parent?.remove(container);
    }
    slot.containers.forEach((container, level) => {
      container.position.copy(computeSlotLocalPosition(slot, level));
    });
    slot.stackHeight = slot.initialCount;
  });
  activeContainer = null;
  pickNextSlot();
  const resetTarget = slots[targetSlotIndex];
  const resetTrolleyLocalX = computeSlotTargetLocalX(resetTarget, resetTarget.stackHeight);
  crane.setTrolleyPosition(resetTrolleyLocalX);
  crane.setHoistDepth(travelClearanceDepth);
  spawnContainerOnAgv();
  animationStates[stateIndex].onStart?.();
};

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    resetSimulation();
  }
});

const animate = () => {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const state = animationStates[stateIndex];
  if (state.duration > 0) {
    stateElapsed += delta;
    const progress = Math.min(stateElapsed / state.duration, 1);
    state.onUpdate?.(progress, delta);

    if (stateElapsed >= state.duration) {
      if (stateIndex == 8) { // wait state
        resetSimulation();
      } else {
        stateIndex = (stateIndex + 1) % animationStates.length;
        stateElapsed = 0;
        animationStates[stateIndex].onStart?.();
      }
    }
  } else {
    state.onUpdate?.(1, delta);
    stateIndex = (stateIndex + 1) % animationStates.length;
    animationStates[stateIndex].onStart?.();
  }
  controls.update();
  renderer.render(scene, camera);
};

animate();
