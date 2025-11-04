import * as THREE from 'three';

const COLOR = {
    gantry: 0xff7b00,
    gantryAccent: 0xfb923c,
    structureDark: 0x1e293b,
    steel: 0x9ca3af,
    cable: 0x0f172a,
    platform: 0x0ea5e9,
    light: 0xfde68a,
    glass: 0x38bdf8
};

const VECTOR = {
    gantrySpan: 35,
    baseDistance: 20,
    boomOutreach: 75,
    backReach: 25,
    towerHeight: 60,
    primaryHoistDepth: 50,
    secondaryHoistDepth: 22
};

const easeInOut = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => THREE.MathUtils.clamp(t, 0, 1);

const createMaterial = (color, options = {}) =>
    new THREE.MeshStandardMaterial({
        color,
        metalness: 0.35,
        roughness: 0.48,
        ...options
    });

function createEdgeLines(mesh, color = 0x000000, thickness = 1) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, linewidth: thickness }));
    // 修复：不要复制 mesh 的 world 变换到 line（会造成“漂浮”边框）
    // line.position.copy(mesh.position);
    // line.rotation.copy(mesh.rotation);
    // line.scale.copy(mesh.scale);
    // 改为重置为局部默认变换（line 添加为 mesh 的子对象后会继承 mesh 的变换）
    line.position.set(0, 0, 0);
    line.rotation.set(0, 0, 0);
    line.scale.set(1, 1, 1);
    mesh.add(line);
}

function createStaircase(height, steps, width, depth, color) {
    const group = new THREE.Group();
    const stepHeight = height / steps;
    const treadDepth = depth / steps;
    const mat = createMaterial(color, { roughness: 0.65, metalness: 0.2 });
    for (let i = 0; i < steps; i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(width, stepHeight * 0.9, treadDepth), mat);
        step.position.set(0, stepHeight * (i + 0.5), -depth / 2 + treadDepth * (i + 0.5));
        step.castShadow = true;
        step.receiveShadow = true;
        group.add(step);
    }
    return group;
}

function createLightingBar(length, segmentCount) {
    const group = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, length, 16), createMaterial(COLOR.steel, { roughness: 0.6 }));
    bar.rotation.z = Math.PI / 2;
    bar.castShadow = true;
    group.add(bar);

    for (let i = 0; i < segmentCount; i++) {
        const lamp = new THREE.Mesh(
            new THREE.ConeGeometry(0.8, 1.6, 16),
            createMaterial(COLOR.light, { emissive: COLOR.light, emissiveIntensity: 0.8 })
        );
        const offset = -length / 2 + ((i + 0.5) * length) / segmentCount;
        lamp.position.set(offset, -0.4, 0);
        lamp.rotation.x = Math.PI;
        group.add(lamp);

        const glow = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16, 1, true),
            new THREE.MeshBasicMaterial({ color: COLOR.light, transparent: true, opacity: 0.22 })
        );
        glow.position.set(offset, -1.2, 0);
        group.add(glow);
    }

    return group;
}

function createCable(from, to, radius = 0.08) {
    const delta = new THREE.Vector3().subVectors(to, from);
    const length = delta.length();
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
    const material = createMaterial(COLOR.cable, { metalness: 0.8, roughness: 0.2 });
    const cable = new THREE.Mesh(geometry, material);
    cable.position.copy(from).addScaledVector(delta, 0.5);
    cable.lookAt(to);
    cable.rotateX(Math.PI / 2);
    cable.castShadow = true;
    return cable;
}

function createWheelAssembly(width, radius, thickness) {
    const group = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(radius, radius, thickness, 24);
    const wheelMat = createMaterial(COLOR.structureDark, { metalness: 0.6, roughness: 0.3 });
    for (const sign of [-1, 1]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sign * width * 0.5, radius, 0);
        wheel.castShadow = true;
        group.add(wheel);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, thickness * 0.6, thickness * 0.8), createMaterial(COLOR.steel));
    beam.position.set(0, radius + thickness * 0.4, 0);
    beam.castShadow = true;
    group.add(beam);
    return group;
}

function buildOperatorCabin() {
    const cabin = new THREE.Group();

    const shell = new THREE.Mesh(
        new THREE.BoxGeometry(6.4, 4, 4),
        createMaterial(COLOR.structureDark, { roughness: 0.42, metalness: 0.3 })
    );
    shell.position.set(0, 2, 0);
    shell.castShadow = true;
    shell.receiveShadow = true;
    cabin.add(shell);

    const windowMaterial = new THREE.MeshStandardMaterial({
        color: COLOR.glass,
        transparent: true,
        opacity: 0.5,
        roughness: 0.1,
        metalness: 0.05,
        envMapIntensity: 1.4
    });

    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 0.12), windowMaterial);
    frontGlass.position.set(0, 2.4, 2.06);
    cabin.add(frontGlass);

    const sideGlassGeo = new THREE.PlaneGeometry(2.8, 2.6);
    const leftGlass = new THREE.Mesh(sideGlassGeo, windowMaterial);
    leftGlass.position.set(-3.1, 2.4, 0);
    leftGlass.rotation.y = Math.PI / 2;
    const rightGlass = leftGlass.clone();
    rightGlass.position.x *= -1;
    cabin.add(leftGlass, rightGlass);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.35, 4), createMaterial(COLOR.gantryAccent));
    frame.position.set(0, 0.2, 0);
    cabin.add(frame);

    const railing = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.4, 10), createMaterial(COLOR.steel));
    railing.rotation.z = Math.PI / 2;
    railing.position.set(0, 4.1, 0);
    cabin.add(railing);

    const ladder = createStaircase(5, 12, 1, 2.4, COLOR.steel);
    ladder.rotation.y = Math.PI / 2;
    ladder.position.set(-3.3, 0, -2);
    cabin.add(ladder);

    return cabin;
}

function createSpreader(name, color = COLOR.platform) {
    const spreader = new THREE.Group();
    spreader.name = name;

    const frame = new THREE.Mesh(new THREE.BoxGeometry(12, 1.2, 3.2), createMaterial(color, { metalness: 0.4 }));
    frame.castShadow = true;
    frame.receiveShadow = true;
    spreader.add(frame);

    const twistLockGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.9, 12);
    const twistLockMat = createMaterial(0xef4444, { emissive: 0xef4444, emissiveIntensity: 0.3 });
    for (const signX of [-1, 1]) {
        for (const signZ of [-1, 1]) {
            const lock = new THREE.Mesh(twistLockGeo, twistLockMat);
            lock.rotation.y = Math.PI / 2;
            lock.position.set(signX * 4.2, -1, signZ * 1.1);
            lock.castShadow = true;
            spreader.add(lock);
        }
    }

    const lightBar = createLightingBar(9, 4);
    lightBar.position.set(0, -0.4, 1.6);
    spreader.add(lightBar);

    return spreader;
}

function createHoistAssembly(spreaderName, travelRange, hoistDepth, axis = 'x') {
    const group = new THREE.Group();
    group.name = `${spreaderName}Assembly`;

    const trolley = new THREE.Mesh(
        new THREE.BoxGeometry(10, 3.6, 6),
        createMaterial(COLOR.structureDark, { roughness: 0.35 })
    );
    trolley.name = `${spreaderName}Trolley`;
    trolley.position.set(0, 2, 0);
    trolley.castShadow = true;
    trolley.receiveShadow = true;
    group.add(trolley);

    const machinery = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 4.2), createMaterial(COLOR.gantryAccent));
    machinery.position.set(0, 4.2, 0);
    machinery.castShadow = true;
    trolley.add(machinery);

    const cableDrum = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 8.4, 24), createMaterial(COLOR.steel));
    cableDrum.rotation.z = Math.PI / 2;
    cableDrum.position.set(0, 3.2, 0);
    trolley.add(cableDrum);

    const spreader = createSpreader(spreaderName);
    spreader.position.set(0, -4, 0);
    trolley.add(spreader);

    // const guideFrame = new THREE.Mesh(new THREE.BoxGeometry(2, hoistDepth, 2), createMaterial(COLOR.steel, { roughness: 0.55 }));
    // guideFrame.position.set(0, -hoistDepth / 2 - 2.8, 0);
    // trolley.add(guideFrame);

    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.25, 12, 24, Math.PI), createMaterial(COLOR.steel));
    hook.rotation.x = Math.PI / 2;
    hook.position.set(0, -hoistDepth - 3.4, 0);
    trolley.add(hook);

    // Cables will be created dynamically in _updateTransforms
    // const cable = createCable(new THREE.Vector3(-4, 3, -2), new THREE.Vector3(-4, -hoistDepth - 2.8, -1.6));
    // trolley.add(cable);
    // trolley.add(createCable(new THREE.Vector3(4, 3, -2), new THREE.Vector3(4, -hoistDepth - 2.8, -1.6)));
    // trolley.add(createCable(new THREE.Vector3(-4, 3, 2), new THREE.Vector3(-4, -hoistDepth - 2.8, 1.6)));
    // trolley.add(createCable(new THREE.Vector3(4, 3, 2), new THREE.Vector3(4, -hoistDepth - 2.8, 1.6)));

    if (axis === 'z') {
        group.rotation.y = Math.PI / 2;
    }

    group.userData = {
        range: travelRange,
        hoistDepth,
        axis,
        trolley,
        spreader,
        cables: [] // Initialize cables array for dynamic creation
    };

    return group;
}

export class DualTrolleyQuayCrane extends THREE.Group {
    constructor() {
        super();
        this.name = 'DualTrolleyQuayCrane';

        this.state = {
            gantry: 0,
            primaryTravel: 0,
            primaryHoist: 0,
            secondaryTravel: 0,
            secondaryHoist: 0,
            platform: 0
        };

        this._buildStructure();
    }

    _buildStructure() {
        const halfGauge = VECTOR.gantrySpan / 2;
        const halfBase = VECTOR.baseDistance / 2;
        const totalRun = VECTOR.boomOutreach + VECTOR.backReach;

        const gantry = new THREE.Group();
        gantry.name = 'gantryFrame';
        this.add(gantry);

        // Base beams & wheels
        const baseBeam = new THREE.Mesh(
            new THREE.BoxGeometry(VECTOR.gantrySpan + 12, 4, VECTOR.baseDistance + 8),
            createMaterial(COLOR.gantry, { metalness: 0.4, roughness: 0.45 })
        );
        baseBeam.position.set(0, 2.5, 0);
        baseBeam.castShadow = true;
        baseBeam.receiveShadow = true;
        gantry.add(baseBeam);

        const railOffset = halfGauge - 1.4;
        for (const z of [-halfBase, halfBase]) {
            for (const x of [-halfGauge, halfGauge]) {
                const wheelAssembly = createWheelAssembly(12, 1.4, 1.2);
                wheelAssembly.position.set(x > 0 ? railOffset : -railOffset, 0, z);
                gantry.add(wheelAssembly);
            }
        }

        // Towers
        const towerGeo = new THREE.BoxGeometry(8, VECTOR.towerHeight, 6);
        const towerMat = createMaterial(COLOR.gantry);
        const towerPositions = [
            [-halfGauge, VECTOR.towerHeight / 2 + 4, -halfBase],
            [-halfGauge, VECTOR.towerHeight / 2 + 4, halfBase],
            [halfGauge, VECTOR.towerHeight / 2 + 4, -halfBase],
            [halfGauge, VECTOR.towerHeight / 2 + 4, halfBase]
        ];
        const towers = towerPositions.map(([x, y, z]) => {
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(x, y, z);
            tower.castShadow = true;
            tower.receiveShadow = true;
            gantry.add(tower);
            return tower;
        });

    const crossBeamSea = new THREE.Mesh(new THREE.BoxGeometry(VECTOR.gantrySpan + 6, 6, 8), createMaterial(COLOR.gantryAccent));
    crossBeamSea.position.set(0, VECTOR.towerHeight + 6, -halfBase);
        crossBeamSea.castShadow = true;
        gantry.add(crossBeamSea);

        const crossBeamLand = crossBeamSea.clone();
    crossBeamLand.position.z = halfBase;
        gantry.add(crossBeamLand);

        const maintenanceDeck = new THREE.Group();
        maintenanceDeck.position.set(0, VECTOR.towerHeight + 14, 0);

        const seaDeck = new THREE.Mesh(
            new THREE.BoxGeometry(VECTOR.boomOutreach, 2, 18),
            createMaterial(COLOR.gantryAccent, { roughness: 0.55 })
        );
        seaDeck.position.set(VECTOR.boomOutreach / 2, 0, 0);
        seaDeck.castShadow = true;
        seaDeck.receiveShadow = true;
        maintenanceDeck.add(seaDeck);

        const landDeck = new THREE.Mesh(
            new THREE.BoxGeometry(VECTOR.backReach, 2, 18),
            createMaterial(COLOR.gantryAccent, { roughness: 0.6 })
        );
        landDeck.position.set(-VECTOR.backReach / 2, 0, 0);
        landDeck.castShadow = true;
        landDeck.receiveShadow = true;
        maintenanceDeck.add(landDeck);

        gantry.add(maintenanceDeck);

        const guardRail = createLightingBar(totalRun, 10);
        guardRail.position.set((VECTOR.boomOutreach - VECTOR.backReach) / 2, VECTOR.towerHeight + 16, 8.5);
        gantry.add(guardRail);

    const ladder = createStaircase(VECTOR.towerHeight + 10, 26, 2.2, 10, COLOR.steel);
    ladder.position.set(-(halfGauge + 4), 4.5, 7);
        gantry.add(ladder);

        const ladderRight = ladder.clone();
    ladderRight.position.x = halfGauge + 4;
        gantry.add(ladderRight);

        // Boom system
        const boomGroup = new THREE.Group();
        boomGroup.name = 'boomSystem';
        gantry.add(boomGroup);

        const boom = new THREE.Mesh(new THREE.BoxGeometry(VECTOR.boomOutreach, 4.2, 6), createMaterial(COLOR.gantry));
        boom.position.set(VECTOR.boomOutreach / 2, VECTOR.towerHeight + 10, -4);
        boom.rotation.z = THREE.MathUtils.degToRad(0);
        boom.castShadow = true;
        boom.receiveShadow = true;
        boomGroup.add(boom);

        const boomTruss = new THREE.Mesh(new THREE.BoxGeometry(VECTOR.boomOutreach + 6, 2.4, 4.2), createMaterial(COLOR.gantryAccent));
        boomTruss.position.set(VECTOR.boomOutreach / 2 + 3, VECTOR.towerHeight + 12, -4);
        boomTruss.rotation.z = THREE.MathUtils.degToRad(0);
        boomTruss.castShadow = true;
        boomGroup.add(boomTruss);

        const backReach = new THREE.Mesh(new THREE.BoxGeometry(VECTOR.backReach, 3.5, 6), createMaterial(COLOR.gantry));
        backReach.position.set(-VECTOR.backReach / 2, VECTOR.towerHeight + 10, 6);
        backReach.castShadow = true;
        boomGroup.add(backReach);

        const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 12), createMaterial(COLOR.structureDark));
        counterWeight.position.set(-VECTOR.backReach - 10, VECTOR.towerHeight + 6, 6);
        counterWeight.castShadow = true;
        boomGroup.add(counterWeight);

        const supportCable = createCable(
            new THREE.Vector3(-VECTOR.backReach * 0.4, VECTOR.towerHeight + 18, 6),
            new THREE.Vector3(VECTOR.boomOutreach, VECTOR.towerHeight + 16, -6),
            0.22
        );
        boomGroup.add(supportCable);

        boomGroup.add(
            createCable(
                new THREE.Vector3(0, VECTOR.towerHeight + 14, 2),
                new THREE.Vector3(VECTOR.boomOutreach * 0.62, VECTOR.towerHeight + 14, -6),
                0.18
            )
        );

        // Operator cabin
        const cabin = buildOperatorCabin();
        cabin.position.set(-VECTOR.backReach + 6, VECTOR.towerHeight + 6, 10);
        gantry.add(cabin);

        // Primary hoist
        this.primaryAssembly = createHoistAssembly(
            'primary',
            { min: 0, max: VECTOR.boomOutreach },
            VECTOR.primaryHoistDepth,
            'x'
        );
        this.primaryAssembly.position.set(0, VECTOR.towerHeight + 16, 0);  // Centered in Z direction
        boomGroup.add(this.primaryAssembly);

        // Secondary hoist on landward side
        this.secondaryAssembly = createHoistAssembly(
            'secondary',
            { min: -VECTOR.backReach, max: 0 },
            VECTOR.secondaryHoistDepth,
            'x'
        );
        // Place secondary trolley baseline at approximately 1/4 of the QC tower height (QC 1/4高度)
        // Primary trolley remains at the top; secondary is lower for landward handover operations.
        const secondaryBaselineY = VECTOR.towerHeight * 0.5;
        this.secondaryAssembly.position.set(-VECTOR.backReach * 0.6, secondaryBaselineY, 0);  // Centered in Z direction
        gantry.add(this.secondaryAssembly);

        // Handover platform
        this.platformGroup = new THREE.Group();
        this.platformGroup.name = 'handoverPlatform';

        const platformBase = new THREE.Mesh(
            new THREE.BoxGeometry(18, 2, 10),
            createMaterial(COLOR.platform, { roughness: 0.4, metalness: 0.5 })
        );
        platformBase.position.set(-VECTOR.backReach / 2, VECTOR.towerHeight + 8, halfBase - 2);
        platformBase.castShadow = true;
        platformBase.receiveShadow = true;
        this.platformGroup.add(platformBase);

        const rollers = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 16, 24),
            createMaterial(COLOR.steel, { roughness: 0.3 })
        );
        rollers.rotation.z = Math.PI / 2;
        rollers.position.set(-VECTOR.backReach / 2, VECTOR.towerHeight + 9.6, halfBase - 0.5);
        rollers.castShadow = true;
        this.platformGroup.add(rollers);

        const buffer = new THREE.Mesh(new THREE.BoxGeometry(18, 1.5, 1.2), createMaterial(0x1e3a8a, { emissive: 0x1e40af, emissiveIntensity: 0.5 }));
        buffer.position.set(-VECTOR.backReach / 2, VECTOR.towerHeight + 9.2, halfBase + 3);
        buffer.castShadow = true;
        this.platformGroup.add(buffer);

        const agvGuide = new THREE.Mesh(new THREE.BoxGeometry(24, 1, 0.8), createMaterial(0x38bdf8, { emissive: 0x0ea5e9, emissiveIntensity: 0.6 }));
        agvGuide.position.set(-VECTOR.backReach / 2, VECTOR.towerHeight + 3.8, halfBase + 6);
        this.platformGroup.add(agvGuide);

        gantry.add(this.platformGroup);

        // Cable trays
    const cableTrayGeo = new THREE.BoxGeometry(4, 1.4, VECTOR.gantrySpan + 4);
    const cableTray = new THREE.Mesh(cableTrayGeo, createMaterial(COLOR.structureDark, { roughness: 0.6 }));
    cableTray.position.set(halfGauge + 6, VECTOR.towerHeight + 12, 0);
        gantry.add(cableTray);

        // Add detailing lines
        createEdgeLines(baseBeam, 0x0f172a, 1);
        towers.forEach((tower) => createEdgeLines(tower, 0x111827, 1));
        [crossBeamSea, crossBeamLand, boom, boomTruss, backReach, platformBase, seaDeck, landDeck].forEach((mesh) =>
            createEdgeLines(mesh, 0x111827, 1)
        );

        this.gantryGroup = gantry;
    }

    applyManualState({ gantry, primaryTravel, primaryHoist, secondaryTravel, secondaryHoist, platform }) {
        this.state = {
            gantry: clamp01(gantry),
            primaryTravel: clamp01(primaryTravel),
            primaryHoist: clamp01(primaryHoist),
            secondaryTravel: clamp01(secondaryTravel),
            secondaryHoist: clamp01(secondaryHoist),
            platform: clamp01(platform)
        };
        this._updateTransforms();
    }

    _updateTransforms() {
        const {
            gantry,
            primaryTravel,
            primaryHoist,
            secondaryTravel,
            secondaryHoist,
            platform
        } = this.state;

        const gantryOffset = THREE.MathUtils.lerp(-60, 60, gantry);
        this.gantryGroup.position.z = gantryOffset;

        const primaryData = this.primaryAssembly.userData;
        const primaryRange = primaryData.range;
        const primaryTravelOffset = THREE.MathUtils.lerp(primaryRange.min, primaryRange.max, primaryTravel);
        if (primaryData.axis === 'x') {
            primaryData.trolley.position.x = primaryTravelOffset;
        } else if (primaryData.axis === 'z') {
            primaryData.trolley.position.z = primaryTravelOffset;
        }
        const primaryHoistDepth = THREE.MathUtils.lerp(-8, -primaryData.hoistDepth, primaryHoist);
        primaryData.spreader.position.y = primaryHoistDepth;

        // Update primary cables dynamically
        primaryData.cables.forEach(c => primaryData.trolley.remove(c));
        primaryData.cables = [];
        const primaryCableConfigs = [
            { from: new THREE.Vector3(-4, 3, -2), to: new THREE.Vector3(-4, primaryData.spreader.position.y - 2.8, -1.6) },
            { from: new THREE.Vector3(4, 3, -2), to: new THREE.Vector3(4, primaryData.spreader.position.y - 2.8, -1.6) },
            { from: new THREE.Vector3(-4, 3, 2), to: new THREE.Vector3(-4, primaryData.spreader.position.y - 2.8, 1.6) },
            { from: new THREE.Vector3(4, 3, 2), to: new THREE.Vector3(4, primaryData.spreader.position.y - 2.8, 1.6) }
        ];
        primaryCableConfigs.forEach(config => {
            const cable = createCable(config.from, config.to);
            primaryData.trolley.add(cable);
            primaryData.cables.push(cable);
        });

        const secondaryData = this.secondaryAssembly.userData;
        const secondaryRange = secondaryData.range;
        const secondaryTravelOffset = THREE.MathUtils.lerp(secondaryRange.min, secondaryRange.max, secondaryTravel);
        if (secondaryData.axis === 'x') {
            secondaryData.trolley.position.x = secondaryTravelOffset;
        } else if (secondaryData.axis === 'z') {
            secondaryData.trolley.position.z = secondaryTravelOffset;
        }
        const secondaryHoistDepthY = THREE.MathUtils.lerp(-6, -secondaryData.hoistDepth, secondaryHoist);
        secondaryData.spreader.position.y = secondaryHoistDepthY;

        // Update secondary cables dynamically
        secondaryData.cables.forEach(c => secondaryData.trolley.remove(c));
        secondaryData.cables = [];
        const secondaryCableConfigs = [
            { from: new THREE.Vector3(-4, 3, -2), to: new THREE.Vector3(-4, secondaryData.spreader.position.y - 2.8, -1.6) },
            { from: new THREE.Vector3(4, 3, -2), to: new THREE.Vector3(4, secondaryData.spreader.position.y - 2.8, -1.6) },
            { from: new THREE.Vector3(-4, 3, 2), to: new THREE.Vector3(-4, secondaryData.spreader.position.y - 2.8, 1.6) },
            { from: new THREE.Vector3(4, 3, 2), to: new THREE.Vector3(4, secondaryData.spreader.position.y - 2.8, 1.6) }
        ];
        secondaryCableConfigs.forEach(config => {
            const cable = createCable(config.from, config.to);
            secondaryData.trolley.add(cable);
            secondaryData.cables.push(cable);
        });

        const platformTilt = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-6, 6, platform));
        this.platformGroup.rotation.y = platformTilt * 0.2;
        this.platformGroup.children.forEach((child, index) => {
            if (index === 1) {
                child.rotation.x = platformTilt * 1.6;
            }
        });
    }

    runAutoCycle(phase, delta) {
        const stages = [
            '主小车抓取舱内集装箱',
            '主小车将箱子放至交接平台',
            '副小车取箱并送至AGV',
            'AGV撤离，副小车返回平台',
            '主小车返回船舶舱内',
            '系统待机'
        ];

        let stageIndex = 0;

        // default resting state near平台
        this.state.primaryTravel = 0.05;
        this.state.primaryHoist = 0.2;
        this.state.secondaryTravel = 0.85;
        this.state.secondaryHoist = 0.2;
        this.state.platform = 0.22;

        if (phase < 0.18) {
            stageIndex = 0;
            const t = easeInOut(phase / 0.18);
            this.state.primaryTravel = 1;
            this.state.primaryHoist = 1 - t;
            this.state.secondaryTravel = 0.85;
            this.state.secondaryHoist = 0.15;
        } else if (phase < 0.36) {
            stageIndex = 1;
            const t = easeInOut((phase - 0.18) / 0.18);
            this.state.primaryTravel = 1 - t;
            this.state.primaryHoist = Math.min(0.2 + t * 0.8, 1);
            this.state.platform = 0.3 + t * 0.15;
        } else if (phase < 0.56) {
            stageIndex = 2;
            const t = easeInOut((phase - 0.36) / 0.2);
            this.state.primaryTravel = 0.05;
            this.state.secondaryTravel = 1 - t;
            this.state.secondaryHoist = t;
            this.state.platform = 0.45 + t * 0.12;
        } else if (phase < 0.76) {
            stageIndex = 3;
            const t = easeInOut((phase - 0.56) / 0.2);
            this.state.secondaryTravel = t;
            this.state.secondaryHoist = 1 - t * 0.85;
            this.state.platform = 0.52 - t * 0.2;
        } else if (phase < 0.92) {
            stageIndex = 4;
            const t = easeInOut((phase - 0.76) / 0.16);
            this.state.primaryTravel = t * 0.95;
            this.state.primaryHoist = 0.3 + t * 0.6;
            this.state.platform = 0.22;
        } else {
            stageIndex = 5;
            const idlePhase = (phase - 0.92) / 0.08;
            this.state.primaryTravel = 0.05 + 0.05 * Math.sin(idlePhase * Math.PI * 2);
            this.state.primaryHoist = 0.18;
            this.state.secondaryTravel = 0.7 + 0.1 * Math.sin(idlePhase * Math.PI * 2);
            this.state.secondaryHoist = 0.18 + 0.08 * Math.sin(idlePhase * Math.PI * 3);
            this.state.platform = 0.24;
        }

        this.state.secondaryTravel = clamp01(this.state.secondaryTravel);
        this.state.secondaryHoist = clamp01(this.state.secondaryHoist);
        this.state.primaryTravel = clamp01(this.state.primaryTravel);
        this.state.primaryHoist = clamp01(this.state.primaryHoist);
        this.state.platform = clamp01(this.state.platform);

        this.state.gantry = clamp01(0.45 + 0.05 * Math.sin(phase * Math.PI * 2));
        this._updateTransforms();

        return stages[stageIndex];
    }
}
