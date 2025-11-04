import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { DualTrolleyQuayCrane } from './quayCrane.js';

const canvas = document.getElementById('viewport');
const modeBadge = document.getElementById('modeBadge');
const stageLabel = document.getElementById('stageLabel');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfe8ff);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(82, 46, 84);
camera.lookAt(0, 20, -6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 18, -6);
controls.maxPolarAngle = Math.PI / 2.05;
controls.update();

scene.add(new THREE.AxesHelper(0)); // Hidden by default but useful if toggled in dev

// Lighting setup
const hemiLight = new THREE.HemisphereLight(0xcbd5f5, 0x0f172a, 0.45);
hemiLight.position.set(0, 140, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff6e6, 1.1);
sunLight.position.set(-110, 160, -90);
sunLight.castShadow = true;
sunLight.shadow.camera.left = -120;
sunLight.shadow.camera.right = 120;
sunLight.shadow.camera.top = 120;
sunLight.shadow.camera.bottom = -120;
sunLight.shadow.camera.far = 400;
sunLight.shadow.mapSize.set(2048, 2048);
scene.add(sunLight);

const fillLight = new THREE.SpotLight(0x4c6ef5, 1.3, 320, THREE.MathUtils.degToRad(40), 0.35, 1);
fillLight.position.set(40, 70, 80);
fillLight.target.position.set(0, 20, 0);
fillLight.castShadow = true;
fillLight.shadow.mapSize.set(1024, 1024);
scene.add(fillLight);
scene.add(fillLight.target);

// Environment: quay apron + water + vessel silhouette
const materialParams = { metalness: 0.2, roughness: 0.75 };
const apronMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, ...materialParams });
const apron = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), apronMat);
apron.rotation.x = -Math.PI / 2;
apron.position.y = 0;
apron.receiveShadow = true;
scene.add(apron);

const quayStripeMat = new THREE.MeshStandardMaterial({ color: 0xbfcad6, emissive: 0x94a3b8, emissiveIntensity: 0.25, roughness: 0.6 });
const quayStripe = new THREE.Mesh(new THREE.PlaneGeometry(220, 26), quayStripeMat);
quayStripe.rotation.x = -Math.PI / 2;
quayStripe.position.set(0, 0.02, -36);
scene.add(quayStripe);

// Coastline marker: bright yellow thin band to indicate the quay edge / coastline
const coastMat = new THREE.MeshStandardMaterial({
    color: 0xfff000,
    emissive: 0xfff000,
    emissiveIntensity: 0.9,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.98
});
const coastLine = new THREE.Mesh(new THREE.PlaneGeometry(220, 0.6), coastMat);
coastLine.rotation.x = -Math.PI / 2;
// place slightly above the quay stripe so it's visible without z-fighting
coastLine.position.set(0, 0.055, -36);
scene.add(coastLine);

const waterMat = new THREE.MeshStandardMaterial({ color: 0x0b1f4b, metalness: 0.5, roughness: 0.18, transparent: true, opacity: 0.9 });
const water = new THREE.Mesh(new THREE.PlaneGeometry(220, 200, 1, 1), waterMat);
water.rotation.x = -Math.PI / 2;
water.position.set(-70, -0.04, -120);
scene.add(water);

const guideRailMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.36, roughness: 0.4 });
const railLength = 220;
const railWidth = 0.6;
const gantryRailOffset = 14.8;
for (const sign of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.35, railWidth), guideRailMat);
    rail.castShadow = false;
    rail.receiveShadow = true;
    rail.position.set(0, 0.2, sign * gantryRailOffset);
    scene.add(rail);

    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 0.9), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 }));
    for (let i = -18; i <= 18; i++) {
        const sleeperClone = sleeper.clone();
        sleeperClone.position.set(i * 5.6, 0.05, sign * gantryRailOffset);
        scene.add(sleeperClone);
    }
}

function buildVesselSilhouette() {
    const hull = new THREE.Mesh(
        new THREE.BoxGeometry(90, 12, 32),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.5, roughness: 0.35 })
    );
    hull.position.set(-54, 6, -88);
    hull.castShadow = true;
    hull.receiveShadow = true;

    const deck = new THREE.Mesh(
        new THREE.BoxGeometry(90, 0.6, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.55, metalness: 0.25 })
    );
    deck.position.set(-54, 12.3, -88);

    const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(18, 16, 14),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x1e40af, emissiveIntensity: 0.4, roughness: 0.28 })
    );
    bridge.position.set(-18, 18, -110);

    const stack = new THREE.Mesh(
        new THREE.CylinderGeometry(4.2, 4.2, 14, 24),
        new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.6, roughness: 0.3 })
    );
    stack.position.set(-30, 19, -110);

    const vessel = new THREE.Group();
    vessel.add(hull, deck, bridge, stack);
    return vessel;
}

const vessel = buildVesselSilhouette();
scene.add(vessel);

function buildAGVBay() {
    const group = new THREE.Group();

    const bayMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.2, roughness: 0.8 });
    const bay = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 20), bayMat);
    bay.position.set(0, 0.3, 16);
    bay.receiveShadow = true;
    group.add(bay);

    const stopMarkMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 0.7, roughness: 0.4 });
    const stopMark = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.4), stopMarkMat);
    stopMark.rotation.x = -Math.PI / 2;
    stopMark.position.set(0, 0.52, 6);
    group.add(stopMark);

    const agvBody = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 5), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.4, roughness: 0.35 }));
    agvBody.position.set(0, 1.2, 16);
    agvBody.castShadow = true;
    agvBody.receiveShadow = true;
    group.add(agvBody);

    const agvCab = new THREE.Mesh(new THREE.BoxGeometry(3, 1.4, 3.8), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
    agvCab.position.set(-2.5, 2.2, 16);
    group.add(agvCab);

    const wheelGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.2, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.3, roughness: 0.6 });
    for (const signX of [-1, 1]) {
        for (const signZ of [-1, 1]) {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(signX * 4.2, 0.7, 16 + signZ * 1.8);
            wheel.castShadow = true;
            group.add(wheel);
        }
    }

    return group;
}

const agvBay = buildAGVBay();
scene.add(agvBay);

// Instantiate crane
const crane = new DualTrolleyQuayCrane();
scene.add(crane);
crane.position.set(0, 0, -10);
// rotate the whole crane 90° counter-clockwise (top view) so Gantry aligns with the quay (coastline)
crane.rotation.y = Math.PI / 2;

// Visual guide: shipping containers on deck
const containerGeo = new THREE.BoxGeometry(6, 2.9, 2.6);
const containerMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.3, roughness: 0.55 });
for (let x = -3; x <= 3; x++) {
    for (let y = 0; y < 2; y++) {
        const cont = new THREE.Mesh(containerGeo, containerMat);
        cont.position.set(-62 + x * 6.4, 13 + y * 3, -96);
        cont.castShadow = true;
        cont.receiveShadow = true;
        scene.add(cont);
    }
}

// GUI state
const gui = new GUI();
const state = {
    mode: 'auto',
    gantry: 0.45,
    primaryTravel: 0.18,
    primaryHoist: 0.32,
    secondaryTravel: 0.56,
    secondaryHoist: 0.45,
    platform: 0.2
};

const modeController = gui.add(state, 'mode', { 自动: 'auto', 手动: 'manual' }).name('运行模式');
const manualFolder = gui.addFolder('手动控制');
manualFolder
    .add(state, 'gantry', 0, 1, 0.001)
    .name('Gantry 位置')
    .onChange(() => state.mode === 'manual' && applyManualState());
manualFolder
    .add(state, 'primaryTravel', 0, 1, 0.001)
    .name('Primary 小车')
    .onChange(() => state.mode === 'manual' && applyManualState());
manualFolder
    .add(state, 'primaryHoist', 0, 1, 0.001)
    .name('Primary 吊具')
    .onChange(() => state.mode === 'manual' && applyManualState());
manualFolder
    .add(state, 'secondaryTravel', 0, 1, 0.001)
    .name('Secondary 小车')
    .onChange(() => state.mode === 'manual' && applyManualState());
manualFolder
    .add(state, 'secondaryHoist', 0, 1, 0.001)
    .name('Secondary 吊具')
    .onChange(() => state.mode === 'manual' && applyManualState());
manualFolder
    .add(state, 'platform', 0, 1, 0.001)
    .name('交接平台')
    .onChange(() => state.mode === 'manual' && applyManualState());

manualFolder.close();

modeController.onChange((value) => {
    updateModeBadge(value);
    if (value === 'manual') {
        applyManualState();
    }
});

function updateModeBadge(mode) {
    if (mode === 'auto') {
        modeBadge.textContent = 'AUTO';
        modeBadge.style.background = 'linear-gradient(135deg, #38bdf8, #2563eb)';
        manualFolder.domElement.style.pointerEvents = 'none';
        manualFolder.domElement.style.opacity = '0.35';
    } else {
        modeBadge.textContent = 'MAN';
        modeBadge.style.background = 'linear-gradient(135deg, #f97316, #ea580c)';
        manualFolder.domElement.style.pointerEvents = 'auto';
        manualFolder.domElement.style.opacity = '1';
    }
}

updateModeBadge(state.mode);

function applyManualState() {
    crane.applyManualState(state);
    stageLabel.textContent = '手动控制模式';
}

const clock = new THREE.Clock();
let autoPhase = 0;
const cycleDuration = 54; // seconds per full DTQC cycle

function animate() {
    const delta = clock.getDelta();
    requestAnimationFrame(animate);

    if (state.mode === 'auto') {
        autoPhase = (autoPhase + delta / cycleDuration) % 1;
        const stage = crane.runAutoCycle(autoPhase, delta);
        stageLabel.textContent = stage;
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
