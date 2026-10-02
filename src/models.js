import * as THREE from 'three';

// Shared Materials Palette for optimal GPU batching and memory efficiency
export const Materials = {
  // Environment
  grassDark: new THREE.MeshLambertMaterial({ color: 0x4caf50 }),
  grassLight: new THREE.MeshLambertMaterial({ color: 0x66bb6a }),
  grassFlower1: new THREE.MeshLambertMaterial({ color: 0xffeb3b }),
  grassFlower2: new THREE.MeshLambertMaterial({ color: 0xff4081 }),
  grassFlower3: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  
  roadAsphalt: new THREE.MeshLambertMaterial({ color: 0x2e3440 }),
  roadStripe: new THREE.MeshLambertMaterial({ color: 0xeceff4 }),
  curb: new THREE.MeshLambertMaterial({ color: 0x4c566a }),
  
  riverWater: new THREE.MeshLambertMaterial({ 
    color: 0x29b6f6, 
    transparent: true, 
    opacity: 0.88,
    reflectivity: 0.9
  }),
  riverShore: new THREE.MeshLambertMaterial({ color: 0x8d6e63 }),
  waterFoam: new THREE.MeshLambertMaterial({ color: 0xe0f7fa }),
  
  railTrack: new THREE.MeshLambertMaterial({ color: 0x78909c }),
  railSleeper: new THREE.MeshLambertMaterial({ color: 0x5d4037 }),
  railGravel: new THREE.MeshLambertMaterial({ color: 0x37474f }),
  railSignalRed: new THREE.MeshBasicMaterial({ color: 0xff1744 }),
  railSignalOff: new THREE.MeshLambertMaterial({ color: 0x3e2723 }),
  railPole: new THREE.MeshLambertMaterial({ color: 0x263238 }),
  
  // Nature
  woodBark: new THREE.MeshLambertMaterial({ color: 0x6d4c41 }),
  woodCut: new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }),
  leavesPine1: new THREE.MeshLambertMaterial({ color: 0x2e7d32 }),
  leavesPine2: new THREE.MeshLambertMaterial({ color: 0x388e3c }),
  leavesDeciduous1: new THREE.MeshLambertMaterial({ color: 0x43a047 }),
  leavesDeciduous2: new THREE.MeshLambertMaterial({ color: 0x7cb342 }),
  apple: new THREE.MeshLambertMaterial({ color: 0xe53935 }),
  rockGrey: new THREE.MeshLambertMaterial({ color: 0x757575 }),
  rockMoss: new THREE.MeshLambertMaterial({ color: 0x558b2f }),
  lilyPad: new THREE.MeshLambertMaterial({ color: 0x33691e }),
  waterFlower: new THREE.MeshLambertMaterial({ color: 0xf48fb1 }),
  
  // Chicken / Player
  chickenWhite: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  chickenRed: new THREE.MeshLambertMaterial({ color: 0xd50000 }),
  chickenYellow: new THREE.MeshLambertMaterial({ color: 0xffb300 }),
  chickenOrange: new THREE.MeshLambertMaterial({ color: 0xf57c00 }),
  chickenEyeBlack: new THREE.MeshBasicMaterial({ color: 0x111111 }),
  chickenEyeHighlight: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  shadowBlob: new THREE.MeshBasicMaterial({ 
    color: 0x000000, 
    transparent: true, 
    opacity: 0.35 
  }),

  // Vehicles
  carRed: new THREE.MeshLambertMaterial({ color: 0xe53935 }),
  carBlue: new THREE.MeshLambertMaterial({ color: 0x1e88e5 }),
  carYellow: new THREE.MeshLambertMaterial({ color: 0xfbc02d }),
  carGreen: new THREE.MeshLambertMaterial({ color: 0x43a047 }),
  carOrange: new THREE.MeshLambertMaterial({ color: 0xfb8c00 }),
  carPurple: new THREE.MeshLambertMaterial({ color: 0x8e24aa }),
  carWhite: new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }),
  carDark: new THREE.MeshLambertMaterial({ color: 0x212121 }),
  
  windowGlass: new THREE.MeshLambertMaterial({ color: 0x81d4fa }),
  headlightOn: new THREE.MeshBasicMaterial({ color: 0xfff9c4 }),
  taillightRed: new THREE.MeshBasicMaterial({ color: 0xff1744 }),
  wheelRubber: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  wheelRim: new THREE.MeshLambertMaterial({ color: 0xb0bec5 }),
  
  // Coin
  coinGold: new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0x443300 }),
  coinShine: new THREE.MeshBasicMaterial({ color: 0xfff59d }),

  // Eagle
  eagleBody: new THREE.MeshLambertMaterial({ color: 0x3e2723 }),
  eagleHead: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  eagleBeak: new THREE.MeshLambertMaterial({ color: 0xffc107 }),
};

// -------------------------------------------------------------
// PLAYER: The Voxel Chicken
// -------------------------------------------------------------
export function createPlayerModel() {
  const group = new THREE.Group();

  // Shadow blob underneath
  const shadowGeo = new THREE.PlaneGeometry(1.0, 1.0);
  const shadowMesh = new THREE.Mesh(shadowGeo, Materials.shadowBlob);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);
  group.userData.shadow = shadowMesh;

  // Character body container (squash & stretch target)
  const bodyRoot = new THREE.Group();
  bodyRoot.position.y = 0.5;
  group.add(bodyRoot);
  group.userData.bodyRoot = bodyRoot;

  // Main cubic torso
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.7, 0.75);
  const torso = new THREE.Mesh(torsoGeo, Materials.chickenWhite);
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyRoot.add(torso);

  // Red comb on top (3 peaks)
  const combGeo1 = new THREE.BoxGeometry(0.18, 0.28, 0.22);
  const comb1 = new THREE.Mesh(combGeo1, Materials.chickenRed);
  comb1.position.set(0, 0.45, 0.05);
  comb1.castShadow = true;
  bodyRoot.add(comb1);

  const combGeo2 = new THREE.BoxGeometry(0.18, 0.2, 0.2);
  const comb2 = new THREE.Mesh(combGeo2, Materials.chickenRed);
  comb2.position.set(0, 0.42, -0.15);
  bodyRoot.add(comb2);

  // Yellow Beak
  const beakGeo = new THREE.BoxGeometry(0.24, 0.16, 0.24);
  const beak = new THREE.Mesh(beakGeo, Materials.chickenYellow);
  beak.position.set(0, 0.06, 0.46);
  beak.castShadow = true;
  bodyRoot.add(beak);

  // Red wattle under beak
  const wattleGeo = new THREE.BoxGeometry(0.14, 0.18, 0.14);
  const wattle = new THREE.Mesh(wattleGeo, Materials.chickenRed);
  wattle.position.set(0, -0.09, 0.42);
  bodyRoot.add(wattle);

  // Eyes (Left & Right)
  const eyeGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
  const eyeLeft = new THREE.Mesh(eyeGeo, Materials.chickenEyeBlack);
  eyeLeft.position.set(0.36, 0.16, 0.2);
  bodyRoot.add(eyeLeft);

  const pupilLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), Materials.chickenEyeHighlight);
  pupilLeft.position.set(0.38, 0.18, 0.22);
  bodyRoot.add(pupilLeft);

  const eyeRight = new THREE.Mesh(eyeGeo, Materials.chickenEyeBlack);
  eyeRight.position.set(-0.36, 0.16, 0.2);
  bodyRoot.add(eyeRight);

  const pupilRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), Materials.chickenEyeHighlight);
  pupilRight.position.set(-0.38, 0.18, 0.22);
  bodyRoot.add(pupilRight);

  // Wings (Left & Right)
  const wingGeo = new THREE.BoxGeometry(0.1, 0.35, 0.45);
  const leftWing = new THREE.Mesh(wingGeo, Materials.chickenWhite);
  leftWing.position.set(0.38, 0, -0.05);
  leftWing.castShadow = true;
  bodyRoot.add(leftWing);
  group.userData.leftWing = leftWing;

  const rightWing = new THREE.Mesh(wingGeo, Materials.chickenWhite);
  rightWing.position.set(-0.38, 0, -0.05);
  rightWing.castShadow = true;
  bodyRoot.add(rightWing);
  group.userData.rightWing = rightWing;

  // Tail feathers
  const tailGeo = new THREE.BoxGeometry(0.3, 0.3, 0.15);
  const tail = new THREE.Mesh(tailGeo, Materials.chickenWhite);
  tail.position.set(0, 0.2, -0.42);
  tail.rotation.x = -0.3;
  bodyRoot.add(tail);

  // Little orange legs / feet
  const legGeo = new THREE.BoxGeometry(0.08, 0.24, 0.08);
  const footGeo = new THREE.BoxGeometry(0.16, 0.06, 0.22);

  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(0.18, -0.35, 0);
  const lLeg = new THREE.Mesh(legGeo, Materials.chickenOrange);
  const lFoot = new THREE.Mesh(footGeo, Materials.chickenOrange);
  lFoot.position.set(0, -0.12, 0.06);
  leftLegGroup.add(lLeg);
  leftLegGroup.add(lFoot);
  bodyRoot.add(leftLegGroup);
  group.userData.leftLeg = leftLegGroup;

  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(-0.18, -0.35, 0);
  const rLeg = new THREE.Mesh(legGeo, Materials.chickenOrange);
  const rFoot = new THREE.Mesh(footGeo, Materials.chickenOrange);
  rFoot.position.set(0, -0.12, 0.06);
  rightLegGroup.add(rLeg);
  rightLegGroup.add(rFoot);
  bodyRoot.add(rightLegGroup);
  group.userData.rightLeg = rightLegGroup;

  return group;
}

// -------------------------------------------------------------
// ENVIRONMENT: Trees, Rocks, Lilypads
// -------------------------------------------------------------
export function createPineTree() {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.7, 6);
  const trunk = new THREE.Mesh(trunkGeo, Materials.woodBark);
  trunk.position.y = 0.35;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Foliage layers (stacked cubes or cones)
  const layer1Geo = new THREE.ConeGeometry(0.8, 0.9, 5);
  const layer1 = new THREE.Mesh(layer1Geo, Materials.leavesPine1);
  layer1.position.y = 0.9;
  layer1.castShadow = true;
  layer1.receiveShadow = true;
  group.add(layer1);

  const layer2Geo = new THREE.ConeGeometry(0.62, 0.8, 5);
  const layer2 = new THREE.Mesh(layer2Geo, Materials.leavesPine2);
  layer2.position.y = 1.35;
  layer2.castShadow = true;
  group.add(layer2);

  const layer3Geo = new THREE.ConeGeometry(0.4, 0.65, 5);
  const layer3 = new THREE.Mesh(layer3Geo, Materials.leavesPine1);
  layer3.position.y = 1.75;
  layer3.castShadow = true;
  group.add(layer3);

  group.userData.height = 2.1;
  return group;
}

export function createDeciduousTree() {
  const group = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.8, 6);
  const trunk = new THREE.Mesh(trunkGeo, Materials.woodBark);
  trunk.position.y = 0.4;
  trunk.castShadow = true;
  group.add(trunk);

  // Fluffy leaf cluster
  const foliageGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
  const foliage = new THREE.Mesh(foliageGeo, Materials.leavesDeciduous1);
  foliage.position.y = 1.25;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  group.add(foliage);

  // Top crown
  const topGeo = new THREE.BoxGeometry(0.75, 0.55, 0.75);
  const topFoliage = new THREE.Mesh(topGeo, Materials.leavesDeciduous2);
  topFoliage.position.y = 1.8;
  topFoliage.castShadow = true;
  group.add(topFoliage);

  // Little apples
  const appleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  const a1 = new THREE.Mesh(appleGeo, Materials.apple);
  a1.position.set(0.45, 1.1, 0.56);
  group.add(a1);

  const a2 = new THREE.Mesh(appleGeo, Materials.apple);
  a2.position.set(-0.45, 1.3, -0.56);
  group.add(a2);

  return group;
}

export function createRock() {
  const group = new THREE.Group();
  const rockGeo = new THREE.DodecahedronGeometry(0.45, 0);
  const rock = new THREE.Mesh(rockGeo, Materials.rockGrey);
  rock.position.y = 0.35;
  rock.scale.set(1.1, 0.8, 0.95);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  // Optional smaller sibling rock
  if (Math.random() > 0.4) {
    const sGeo = new THREE.DodecahedronGeometry(0.25, 0);
    const sRock = new THREE.Mesh(sGeo, Materials.rockGrey);
    sRock.position.set(0.35, 0.18, 0.2);
    sRock.castShadow = true;
    group.add(sRock);
  }

  return group;
}

// -------------------------------------------------------------
// RIVER: Floating Logs & Lily Pads
// -------------------------------------------------------------
export function createLog(length = 3.2) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, length, 8);
  const body = new THREE.Mesh(bodyGeo, Materials.woodBark);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Cut ends
  const endGeo = new THREE.CircleGeometry(0.39, 8);
  const end1 = new THREE.Mesh(endGeo, Materials.woodCut);
  end1.rotation.y = -Math.PI / 2;
  end1.position.x = -length / 2 - 0.001;
  group.add(end1);

  const end2 = new THREE.Mesh(endGeo, Materials.woodCut);
  end2.rotation.y = Math.PI / 2;
  end2.position.x = length / 2 + 0.001;
  group.add(end2);

  group.userData.length = length;
  group.userData.width = 0.8;
  group.userData.height = 0.6;
  return group;
}

export function createLilyPad() {
  const group = new THREE.Group();

  const padGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12);
  const pad = new THREE.Mesh(padGeo, Materials.lilyPad);
  pad.position.y = 0.04;
  pad.receiveShadow = true;
  group.add(pad);

  // Pink flower
  const flowerGeo = new THREE.DodecahedronGeometry(0.14, 0);
  const flower = new THREE.Mesh(flowerGeo, Materials.waterFlower);
  flower.position.set(0.15, 0.12, 0.15);
  group.add(flower);

  group.userData.length = 1.3;
  group.userData.width = 1.3;
  return group;
}

// -------------------------------------------------------------
// VEHICLES: Cars, Trucks, Buses, Trains
// -------------------------------------------------------------
export function createCar(colorMaterial = Materials.carRed) {
  const group = new THREE.Group();

  // Main chassis
  const bodyGeo = new THREE.BoxGeometry(2.4, 0.65, 1.25);
  const body = new THREE.Mesh(bodyGeo, colorMaterial);
  body.position.y = 0.55;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Cabin / Windows
  const cabinGeo = new THREE.BoxGeometry(1.3, 0.55, 1.15);
  const cabin = new THREE.Mesh(cabinGeo, Materials.windowGlass);
  cabin.position.set(-0.15, 1.05, 0);
  cabin.castShadow = true;
  group.add(cabin);

  // Cabin roof
  const roofGeo = new THREE.BoxGeometry(1.32, 0.08, 1.18);
  const roof = new THREE.Mesh(roofGeo, colorMaterial);
  roof.position.set(-0.15, 1.34, 0);
  group.add(roof);

  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.08, 0.18, 0.24);
  const hl1 = new THREE.Mesh(lightGeo, Materials.headlightOn);
  hl1.position.set(1.21, 0.55, 0.38);
  group.add(hl1);

  const hl2 = new THREE.Mesh(lightGeo, Materials.headlightOn);
  hl2.position.set(1.21, 0.55, -0.38);
  group.add(hl2);

  // Taillights
  const tl1 = new THREE.Mesh(lightGeo, Materials.taillightRed);
  tl1.position.set(-1.21, 0.55, 0.38);
  group.add(tl1);

  const tl2 = new THREE.Mesh(lightGeo, Materials.taillightRed);
  tl2.position.set(-1.21, 0.55, -0.38);
  group.add(tl2);

  // 4 Wheels
  const wheelPositions = [
    [0.7, 0.28, 0.62],
    [0.7, 0.28, -0.62],
    [-0.7, 0.28, 0.62],
    [-0.7, 0.28, -0.62],
  ];
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 8);
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, Materials.wheelRubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.userData.hitLength = 2.4;
  group.userData.hitWidth = 1.25;
  return group;
}

export function createTruck(colorMaterial = Materials.carBlue) {
  const group = new THREE.Group();

  // Cab
  const cabGeo = new THREE.BoxGeometry(1.2, 1.1, 1.35);
  const cab = new THREE.Mesh(cabGeo, colorMaterial);
  cab.position.set(1.3, 0.8, 0);
  cab.castShadow = true;
  group.add(cab);

  // Windshield
  const wsGeo = new THREE.BoxGeometry(0.1, 0.45, 1.2);
  const ws = new THREE.Mesh(wsGeo, Materials.windowGlass);
  ws.position.set(1.86, 0.95, 0);
  group.add(ws);

  // Big Cargo Box
  const cargoGeo = new THREE.BoxGeometry(2.4, 1.4, 1.4);
  const cargo = new THREE.Mesh(cargoGeo, Materials.carWhite);
  cargo.position.set(-0.6, 1.05, 0);
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  group.add(cargo);

  // Decorative stripe on cargo
  const stripeGeo = new THREE.BoxGeometry(2.42, 0.2, 1.42);
  const stripe = new THREE.Mesh(stripeGeo, colorMaterial);
  stripe.position.set(-0.6, 0.8, 0);
  group.add(stripe);

  // Headlights & Taillights
  const lightGeo = new THREE.BoxGeometry(0.08, 0.2, 0.25);
  const hl1 = new THREE.Mesh(lightGeo, Materials.headlightOn);
  hl1.position.set(1.91, 0.55, 0.42);
  group.add(hl1);
  const hl2 = new THREE.Mesh(lightGeo, Materials.headlightOn);
  hl2.position.set(1.91, 0.55, -0.42);
  group.add(hl2);

  // Wheels (6 wheels)
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 8);
  const wheelPositions = [
    [1.3, 0.32, 0.68],
    [1.3, 0.32, -0.68],
    [-0.2, 0.32, 0.7],
    [-0.2, 0.32, -0.7],
    [-1.2, 0.32, 0.7],
    [-1.2, 0.32, -0.7],
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, Materials.wheelRubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.userData.hitLength = 3.8;
  group.userData.hitWidth = 1.45;
  return group;
}

export function createBus() {
  const group = new THREE.Group();

  // Long bus body
  const bodyGeo = new THREE.BoxGeometry(4.4, 1.4, 1.35);
  const body = new THREE.Mesh(bodyGeo, Materials.carYellow);
  body.position.y = 1.0;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Windows band
  const winGeo = new THREE.BoxGeometry(4.2, 0.45, 1.38);
  const win = new THREE.Mesh(winGeo, Materials.windowGlass);
  win.position.set(0, 1.15, 0);
  group.add(win);

  // Front Windshield
  const frontWinGeo = new THREE.BoxGeometry(0.1, 0.6, 1.25);
  const fWin = new THREE.Mesh(frontWinGeo, Materials.windowGlass);
  fWin.position.set(2.21, 1.05, 0);
  group.add(fWin);

  // Headlights
  const lightGeo = new THREE.BoxGeometry(0.08, 0.22, 0.25);
  const hl1 = new THREE.Mesh(lightGeo, Materials.headlightOn);
  hl1.position.set(2.21, 0.55, 0.45);
  group.add(hl1);
  const hl2 = new THREE.Mesh(lightGeo, Materials.headlightOn);
  hl2.position.set(2.21, 0.55, -0.45);
  group.add(hl2);

  // Wheels (6 wheels)
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 8);
  const wheelPositions = [
    [1.5, 0.32, 0.68],
    [1.5, 0.32, -0.68],
    [-1.0, 0.32, 0.68],
    [-1.0, 0.32, -0.68],
    [-1.7, 0.32, 0.68],
    [-1.7, 0.32, -0.68],
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, Materials.wheelRubber);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
  });

  group.userData.hitLength = 4.4;
  group.userData.hitWidth = 1.35;
  return group;
}

export function createTrain() {
  const group = new THREE.Group();

  const carLength = 5.0;
  const numCars = 4;
  const totalLength = numCars * carLength + (numCars - 1) * 0.4;

  for (let i = 0; i < numCars; i++) {
    const carGroup = new THREE.Group();
    const xPos = (i - (numCars - 1) / 2) * (carLength + 0.4);
    carGroup.position.x = xPos;

    // Train Car Body
    const carMat = i === numCars - 1 ? Materials.carRed : Materials.carWhite;
    const bodyGeo = new THREE.BoxGeometry(carLength, 1.6, 1.4);
    const body = new THREE.Mesh(bodyGeo, carMat);
    body.position.y = 1.05;
    body.castShadow = true;
    carGroup.add(body);

    // Stripe
    const stripeGeo = new THREE.BoxGeometry(carLength + 0.02, 0.3, 1.42);
    const stripe = new THREE.Mesh(stripeGeo, Materials.carBlue);
    stripe.position.y = 0.8;
    carGroup.add(stripe);

    // Windows
    const winGeo = new THREE.BoxGeometry(carLength - 0.8, 0.45, 1.44);
    const win = new THREE.Mesh(winGeo, Materials.carDark);
    win.position.y = 1.25;
    carGroup.add(win);

    // Front Locomotive headlight if leading car
    if (i === numCars - 1) {
      const hlGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 8);
      const hl = new THREE.Mesh(hlGeo, Materials.headlightOn);
      hl.rotation.z = Math.PI / 2;
      hl.position.set(carLength / 2 + 0.05, 1.0, 0);
      carGroup.add(hl);
    }

    group.add(carGroup);
  }

  group.userData.hitLength = totalLength;
  group.userData.hitWidth = 1.4;
  return group;
}

// -------------------------------------------------------------
// RAIL SIGNAL: Flashing Warning Light
// -------------------------------------------------------------
export function createRailSignal() {
  const group = new THREE.Group();

  // Pole
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6);
  const pole = new THREE.Mesh(poleGeo, Materials.railPole);
  pole.position.y = 1.0;
  pole.castShadow = true;
  group.add(pole);

  // Crossbuck
  const armGeo = new THREE.BoxGeometry(0.8, 0.15, 0.05);
  const arm1 = new THREE.Mesh(armGeo, Materials.roadStripe);
  arm1.position.y = 1.85;
  arm1.rotation.z = 0.785;
  group.add(arm1);

  const arm2 = new THREE.Mesh(armGeo, Materials.roadStripe);
  arm2.position.y = 1.85;
  arm2.rotation.z = -0.785;
  group.add(arm2);

  // Red Lights (Left and Right)
  const lampGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 8);
  const lampLeft = new THREE.Mesh(lampGeo, Materials.railSignalOff);
  lampLeft.rotation.x = Math.PI / 2;
  lampLeft.position.set(-0.35, 1.5, 0.06);
  group.add(lampLeft);

  const lampRight = new THREE.Mesh(lampGeo, Materials.railSignalOff);
  lampRight.rotation.x = Math.PI / 2;
  lampRight.position.set(0.35, 1.5, 0.06);
  group.add(lampRight);

  group.userData.lampLeft = lampLeft;
  group.userData.lampRight = lampRight;
  return group;
}

// -------------------------------------------------------------
// COLLECTIBLE: Gold Coin
// -------------------------------------------------------------
export function createCoin() {
  const group = new THREE.Group();

  const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12);
  const coin = new THREE.Mesh(coinGeo, Materials.coinGold);
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  group.add(coin);

  const starGeo = new THREE.BoxGeometry(0.18, 0.18, 0.12);
  const star = new THREE.Mesh(starGeo, Materials.coinShine);
  group.add(star);

  group.position.y = 0.55;
  return group;
}

// -------------------------------------------------------------
// EAGLE: Predator that swoops down on AFK / lingering player
// -------------------------------------------------------------
export function createEagle() {
  const group = new THREE.Group();

  // Torso
  const bodyGeo = new THREE.BoxGeometry(1.2, 0.65, 0.65);
  const body = new THREE.Mesh(bodyGeo, Materials.eagleBody);
  body.castShadow = true;
  group.add(body);

  // White Head
  const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const head = new THREE.Mesh(headGeo, Materials.eagleHead);
  head.position.set(0, -0.1, 0.55);
  group.add(head);

  // Hooked yellow beak
  const beakGeo = new THREE.BoxGeometry(0.24, 0.26, 0.35);
  const beak = new THREE.Mesh(beakGeo, Materials.eagleBeak);
  beak.position.set(0, -0.22, 0.85);
  group.add(beak);

  // Wings (Left & Right)
  const wingGeo = new THREE.BoxGeometry(1.6, 0.08, 0.7);
  const leftWing = new THREE.Mesh(wingGeo, Materials.eagleBody);
  leftWing.position.set(1.2, 0.1, 0);
  group.add(leftWing);
  group.userData.leftWing = leftWing;

  const rightWing = new THREE.Mesh(wingGeo, Materials.eagleBody);
  rightWing.position.set(-1.2, 0.1, 0);
  group.add(rightWing);
  group.userData.rightWing = rightWing;

  return group;
}
