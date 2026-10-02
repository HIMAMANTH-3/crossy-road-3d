import * as THREE from 'three';
import {
  Materials,
  createPineTree,
  createDeciduousTree,
  createRock,
  createLog,
  createLilyPad,
  createCar,
  createTruck,
  createBus,
  createTrain,
  createRailSignal,
  createCoin
} from './models.js';
import { sounds } from './audio.js';

export const STEP = 2.0;
export const MIN_COL = -7;
export const MAX_COL = 7;
export const DESPAWN_DIST = 16;
export const SPAWN_AHEAD = 36;

export class WorldManager {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particles = particleSystem;
    this.lanes = new Map(); // rowIndex -> Lane object
    this.highestRowGenerated = -1;
    this.lowestRowActive = 0;
    this.coins = []; // active coin meshes

    // Vehicle color rotation
    this.carColors = [
      Materials.carRed,
      Materials.carBlue,
      Materials.carYellow,
      Materials.carGreen,
      Materials.carOrange,
      Materials.carPurple
    ];

    // Reusable Lane base geometries
    this.laneTileGeo = new THREE.BoxGeometry(40, 0.4, STEP);
    this.waterTileGeo = new THREE.BoxGeometry(40, 0.3, STEP);
    this.railGravelGeo = new THREE.BoxGeometry(40, 0.35, STEP);
    this.stripeGeo = new THREE.BoxGeometry(1.2, 0.02, 0.15);
    this.curbGeo = new THREE.BoxGeometry(40, 0.1, 0.15);
    this.trackBarGeo = new THREE.BoxGeometry(40, 0.1, 0.08);
    this.sleeperGeo = new THREE.BoxGeometry(0.22, 0.08, 1.4);
  }

  // Generate initial world
  init() {
    this.clear();

    // Safe starting platform (grass)
    for (let r = -5; r <= 3; r++) {
      this.generateLane(r, 'GRASS', true); // empty safe zone
    }

    // Generate lanes ahead
    for (let r = 4; r <= SPAWN_AHEAD; r++) {
      this.generateProceduralLane(r);
    }
  }

  clear() {
    for (const [rowIndex, lane] of this.lanes.entries()) {
      this.removeLane(rowIndex);
    }
    this.lanes.clear();
    this.coins = [];
    this.highestRowGenerated = -1;
    this.lowestRowActive = 0;
  }

  generateProceduralLane(rowIndex) {
    // Determine lane type based on difficulty and pattern rules
    // Avoid too many consecutive rivers or rails
    const prevLane = this.lanes.get(rowIndex - 1);
    const prevType = prevLane ? prevLane.type : 'GRASS';
    const prev2Lane = this.lanes.get(rowIndex - 2);
    const prev2Type = prev2Lane ? prev2Lane.type : 'GRASS';

    let type = 'GRASS';
    const roll = Math.random();

    // Pattern probability rules
    if (prevType === 'RIVER' && prev2Type === 'RIVER') {
      // Limit consecutive rivers to max 2
      type = Math.random() < 0.6 ? 'GRASS' : 'ROAD';
    } else if (prevType === 'RAIL') {
      // Never 2 consecutive rail lanes
      type = Math.random() < 0.5 ? 'GRASS' : 'ROAD';
    } else if (prevType === 'ROAD' && prev2Type === 'ROAD' && Math.random() < 0.35) {
      // Break long roads with grass or river
      type = Math.random() < 0.5 ? 'GRASS' : 'RIVER';
    } else {
      // General distribution
      const difficulty = Math.min(1.0, rowIndex / 60);
      const roadChance = 0.45 + difficulty * 0.15;
      const riverChance = 0.25 + difficulty * 0.1;
      const railChance = 0.1 + difficulty * 0.05;

      if (roll < roadChance) {
        type = 'ROAD';
      } else if (roll < roadChance + riverChance) {
        type = 'RIVER';
      } else if (roll < roadChance + riverChance + railChance) {
        type = 'RAIL';
      } else {
        type = 'GRASS';
      }
    }

    this.generateLane(rowIndex, type, false);
  }

  generateLane(rowIndex, type, isSafeStart = false) {
    const laneZ = rowIndex * STEP;
    const laneGroup = new THREE.Group();
    laneGroup.position.set(0, 0, laneZ);
    this.scene.add(laneGroup);

    const laneData = {
      rowIndex,
      z: laneZ,
      type,
      group: laneGroup,
      obstacles: new Map(), // colIndex -> obstacle mesh
      movingItems: [], // vehicles, logs, train
      speed: 0,
      direction: Math.random() > 0.5 ? 1 : -1,
      spawnTimer: 0,
      spawnInterval: 2.5,
      // For rails
      railState: 'IDLE', // IDLE, WARNING, TRAIN
      railTimer: 5 + Math.random() * 8,
      railSignals: [],
    };

    // Build visual ground for this lane
    if (type === 'GRASS') {
      this.buildGrassLane(laneData, isSafeStart);
    } else if (type === 'ROAD') {
      this.buildRoadLane(laneData);
    } else if (type === 'RIVER') {
      this.buildRiverLane(laneData);
    } else if (type === 'RAIL') {
      this.buildRailLane(laneData);
    }

    this.lanes.set(rowIndex, laneData);
    this.highestRowGenerated = Math.max(this.highestRowGenerated, rowIndex);
  }

  buildGrassLane(laneData, isSafeStart) {
    // Base grass slab
    const isDark = Math.abs(laneData.rowIndex) % 2 === 0;
    const grassMesh = new THREE.Mesh(
      this.laneTileGeo, 
      isDark ? Materials.grassDark : Materials.grassLight
    );
    grassMesh.position.y = -0.2;
    grassMesh.receiveShadow = true;
    laneData.group.add(grassMesh);

    // Side border trees (keep player contained)
    for (let c = -14; c <= MIN_COL - 1; c++) {
      this.addStaticObstacle(laneData, c, 'TREE');
    }
    for (let c = MAX_COL + 1; c <= 14; c++) {
      this.addStaticObstacle(laneData, c, 'TREE');
    }

    if (isSafeStart) return;

    // Interior obstacles (trees, rocks, flowers)
    // Guarantee passable corridor
    const availableCols = [];
    for (let c = MIN_COL; c <= MAX_COL; c++) {
      availableCols.push(c);
    }

    // Pick 1 to 3 obstacle columns randomly, leaving at least 3 adjacent free paths
    const obstacleCount = 1 + Math.floor(Math.random() * 3);
    const chosenObstacles = new Set();
    
    // Safety check: ensure center is never instantly blocked right on the player
    for (let i = 0; i < obstacleCount; i++) {
      const col = availableCols[Math.floor(Math.random() * availableCols.length)];
      if (laneData.rowIndex <= 3 && col === 0) continue; // Keep player start clear
      chosenObstacles.add(col);
    }

    chosenObstacles.forEach(col => {
      const type = Math.random() > 0.35 ? 'TREE' : 'ROCK';
      this.addStaticObstacle(laneData, col, type);
    });

    // Random flowers on empty tiles
    for (let c = MIN_COL; c <= MAX_COL; c++) {
      if (!chosenObstacles.has(c) && Math.random() < 0.25) {
        const flowerMat = Math.random() > 0.5 ? Materials.grassFlower1 : Materials.grassFlower2;
        const flower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), flowerMat);
        flower.position.set(c * STEP + (Math.random() - 0.5) * 0.8, 0.06, (Math.random() - 0.5) * 0.8);
        laneData.group.add(flower);
      }
    }

    // Rare gold coin placement on safe tiles
    if (laneData.rowIndex > 3 && Math.random() < 0.18) {
      const validCols = availableCols.filter(c => !chosenObstacles.has(c));
      if (validCols.length > 0) {
        const coinCol = validCols[Math.floor(Math.random() * validCols.length)];
        this.spawnCoin(laneData.group, coinCol * STEP, laneData.rowIndex);
      }
    }
  }

  addStaticObstacle(laneData, col, type) {
    let obsMesh;
    if (type === 'TREE') {
      obsMesh = Math.random() > 0.4 ? createPineTree() : createDeciduousTree();
    } else {
      obsMesh = createRock();
    }
    obsMesh.position.x = col * STEP;
    laneData.group.add(obsMesh);
    laneData.obstacles.set(col, { type, mesh: obsMesh, col });
  }

  buildRoadLane(laneData) {
    // Road asphalt slab
    const roadMesh = new THREE.Mesh(this.laneTileGeo, Materials.roadAsphalt);
    roadMesh.position.y = -0.2;
    roadMesh.receiveShadow = true;
    laneData.group.add(roadMesh);

    // Dashed center stripes
    for (let x = -18; x <= 18; x += 3.5) {
      const stripe = new THREE.Mesh(this.stripeGeo, Materials.roadStripe);
      stripe.position.set(x, 0.01, 0);
      laneData.group.add(stripe);
    }

    // Curbs
    const curbNorth = new THREE.Mesh(this.curbGeo, Materials.curb);
    curbNorth.position.set(0, 0.04, STEP / 2 - 0.08);
    laneData.group.add(curbNorth);

    const curbSouth = new THREE.Mesh(this.curbGeo, Materials.curb);
    curbSouth.position.set(0, 0.04, -STEP / 2 + 0.08);
    laneData.group.add(curbSouth);

    // Traffic configuration with difficulty scaling
    const difficulty = Math.min(1.0, laneData.rowIndex / 70);
    laneData.speed = (4.5 + Math.random() * 4.0 + difficulty * 4.5) * laneData.direction;
    laneData.spawnInterval = Math.max(1.4, 3.2 - difficulty * 1.2 + (Math.random() * 0.8));
    laneData.spawnTimer = Math.random() * laneData.spawnInterval;

    // Pre-populate with 2-3 initial vehicles so the road isn't empty when player reaches it
    const initialPositions = laneData.direction > 0 ? [-14, -2, 10] : [14, 2, -10];
    initialPositions.forEach(x => {
      if (Math.random() > 0.25) {
        this.spawnVehicle(laneData, x);
      }
    });
  }

  spawnVehicle(laneData, startX = null) {
    const dir = laneData.direction;
    const spawnX = startX !== null ? startX : (dir > 0 ? -22 : 22);

    // Choose vehicle type based on random roll
    const roll = Math.random();
    let vehicle;
    const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];

    if (roll < 0.6) {
      vehicle = createCar(color);
    } else if (roll < 0.88) {
      vehicle = createTruck(color);
    } else {
      vehicle = createBus();
    }

    // Orient vehicle facing travel direction
    vehicle.rotation.y = dir > 0 ? 0 : Math.PI;
    vehicle.position.set(spawnX, 0, 0);

    laneData.group.add(vehicle);
    laneData.movingItems.push({
      mesh: vehicle,
      speed: laneData.speed,
      length: vehicle.userData.hitLength || 2.4,
      width: vehicle.userData.hitWidth || 1.25,
      type: 'VEHICLE'
    });
  }

  buildRiverLane(laneData) {
    // Water slab
    const waterMesh = new THREE.Mesh(this.waterTileGeo, Materials.riverWater);
    waterMesh.position.y = -0.22;
    waterMesh.receiveShadow = true;
    laneData.group.add(waterMesh);

    // River banks / shore
    const shoreNorth = new THREE.Mesh(this.curbGeo, Materials.riverShore);
    shoreNorth.position.set(0, 0.02, STEP / 2 - 0.08);
    laneData.group.add(shoreNorth);

    const shoreSouth = new THREE.Mesh(this.curbGeo, Materials.riverShore);
    shoreSouth.position.set(0, 0.02, -STEP / 2 + 0.08);
    laneData.group.add(shoreSouth);

    // Floating log configuration
    const difficulty = Math.min(1.0, laneData.rowIndex / 60);
    laneData.speed = (2.8 + Math.random() * 2.5 + difficulty * 2.2) * laneData.direction;
    laneData.spawnInterval = 2.6 + Math.random() * 1.5;
    laneData.spawnTimer = Math.random() * laneData.spawnInterval;

    // Pre-populate with initial logs/lilypads so river is navigable
    const initialPositions = laneData.direction > 0 ? [-12, -2, 8] : [12, 2, -8];
    initialPositions.forEach(x => {
      this.spawnRiverItem(laneData, x);
    });
  }

  spawnRiverItem(laneData, startX = null) {
    const dir = laneData.direction;
    const spawnX = startX !== null ? startX : (dir > 0 ? -22 : 22);

    let itemMesh;
    let length = 3.2;

    const roll = Math.random();
    if (roll < 0.25) {
      // Lilypad
      itemMesh = createLilyPad();
      length = 1.3;
    } else if (roll < 0.65) {
      // Medium log
      length = 3.4;
      itemMesh = createLog(length);
    } else if (roll < 0.88) {
      // Long log
      length = 5.0;
      itemMesh = createLog(length);
    } else {
      // Short log
      length = 2.4;
      itemMesh = createLog(length);
    }

    itemMesh.position.set(spawnX, 0.05, 0);
    laneData.group.add(itemMesh);

    laneData.movingItems.push({
      mesh: itemMesh,
      speed: laneData.speed,
      length: length,
      width: 0.9,
      type: 'LOG'
    });
  }

  buildRailLane(laneData) {
    // Gravel bed
    const gravel = new THREE.Mesh(this.railGravelGeo, Materials.railGravel);
    gravel.position.y = -0.18;
    gravel.receiveShadow = true;
    laneData.group.add(gravel);

    // Rails (parallel metal bars)
    const rail1 = new THREE.Mesh(this.trackBarGeo, Materials.railTrack);
    rail1.position.set(0, 0.05, 0.45);
    laneData.group.add(rail1);

    const rail2 = new THREE.Mesh(this.trackBarGeo, Materials.railTrack);
    rail2.position.set(0, 0.05, -0.45);
    laneData.group.add(rail2);

    // Sleepers (ties) across track
    for (let x = -18; x <= 18; x += 1.4) {
      const sleeper = new THREE.Mesh(this.sleeperGeo, Materials.railSleeper);
      sleeper.position.set(x, 0.01, 0);
      laneData.group.add(sleeper);
    }

    // Rail signal poles on edges
    const signalLeft = createRailSignal();
    signalLeft.position.set(-8, 0, STEP / 2 - 0.3);
    laneData.group.add(signalLeft);
    laneData.railSignals.push(signalLeft);

    const signalRight = createRailSignal();
    signalRight.position.set(8, 0, STEP / 2 - 0.3);
    laneData.group.add(signalRight);
    laneData.railSignals.push(signalRight);

    laneData.railState = 'IDLE';
    laneData.railTimer = 4 + Math.random() * 7;
    laneData.warningTime = 0;
    laneData.speed = 36 * laneData.direction; // Super fast train
  }

  spawnCoin(parentGroup, x, rowIndex) {
    const coin = createCoin();
    coin.position.x = x;
    parentGroup.add(coin);
    this.coins.push({
      mesh: coin,
      rowIndex,
      x,
      z: rowIndex * STEP,
      collected: false
    });
  }

  update(dt, playerRow) {
    // Generate new lanes ahead of player
    while (this.highestRowGenerated < playerRow + SPAWN_AHEAD) {
      this.highestRowGenerated++;
      this.generateProceduralLane(this.highestRowGenerated);
    }

    // Despawn old lanes far behind player
    const cutoffRow = playerRow - DESPAWN_DIST;
    for (const [rowIndex, lane] of this.lanes.entries()) {
      if (rowIndex < cutoffRow) {
        this.removeLane(rowIndex);
      }
    }

    // Update active lanes
    for (const lane of this.lanes.values()) {
      if (lane.type === 'ROAD') {
        this.updateRoadLane(lane, dt);
      } else if (lane.type === 'RIVER') {
        this.updateRiverLane(lane, dt);
      } else if (lane.type === 'RAIL') {
        this.updateRailLane(lane, dt);
      }
    }

    // Animate coins (rotate & gentle bob)
    const time = performance.now() * 0.003;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.collected) {
        this.coins.splice(i, 1);
        continue;
      }
      c.mesh.rotation.y += dt * 3.5;
      c.mesh.position.y = 0.55 + Math.sin(time + c.rowIndex) * 0.12;
    }
  }

  updateRoadLane(lane, dt) {
    // Spawn new vehicles on timer
    lane.spawnTimer -= dt;
    if (lane.spawnTimer <= 0) {
      lane.spawnTimer = lane.spawnInterval + (Math.random() * 0.6);
      this.spawnVehicle(lane);
    }

    // Move existing vehicles
    for (let i = lane.movingItems.length - 1; i >= 0; i--) {
      const item = lane.movingItems[i];
      item.mesh.position.x += item.speed * dt;

      // Despawn when out of view
      if (lane.direction > 0 && item.mesh.position.x > 26) {
        lane.group.remove(item.mesh);
        lane.movingItems.splice(i, 1);
      } else if (lane.direction < 0 && item.mesh.position.x < -26) {
        lane.group.remove(item.mesh);
        lane.movingItems.splice(i, 1);
      }
    }
  }

  updateRiverLane(lane, dt) {
    // Spawn logs
    lane.spawnTimer -= dt;
    if (lane.spawnTimer <= 0) {
      lane.spawnTimer = lane.spawnInterval + (Math.random() * 0.8);
      this.spawnRiverItem(lane);
    }

    // Move logs & lilypads
    for (let i = lane.movingItems.length - 1; i >= 0; i--) {
      const item = lane.movingItems[i];
      item.mesh.position.x += item.speed * dt;

      if (lane.direction > 0 && item.mesh.position.x > 25) {
        lane.group.remove(item.mesh);
        lane.movingItems.splice(i, 1);
      } else if (lane.direction < 0 && item.mesh.position.x < -25) {
        lane.group.remove(item.mesh);
        lane.movingItems.splice(i, 1);
      }
    }
  }

  updateRailLane(lane, dt) {
    if (lane.railState === 'IDLE') {
      lane.railTimer -= dt;
      if (lane.railTimer <= 0) {
        lane.railState = 'WARNING';
        lane.warningTime = 2.2; // 2.2 seconds of ringing bells & flashing lights
        sounds.playTrainBell();
      }
    } else if (lane.railState === 'WARNING') {
      lane.warningTime -= dt;

      // Flashing alternating red signals
      const flash = Math.floor(performance.now() / 150) % 2 === 0;
      lane.railSignals.forEach(sig => {
        if (sig.userData.lampLeft && sig.userData.lampRight) {
          sig.userData.lampLeft.material = flash ? Materials.railSignalRed : Materials.railSignalOff;
          sig.userData.lampRight.material = !flash ? Materials.railSignalRed : Materials.railSignalOff;
        }
      });

      // Periodic bell during warning
      if (Math.floor(lane.warningTime * 10) % 4 === 0) {
        sounds.playTrainBell();
      }

      if (lane.warningTime <= 0) {
        // Spawn fast train!
        lane.railState = 'TRAIN';
        const train = createTrain();
        const startX = lane.direction > 0 ? -35 : 35;
        train.position.set(startX, 0, 0);
        train.rotation.y = lane.direction > 0 ? 0 : Math.PI;
        lane.group.add(train);

        lane.movingItems.push({
          mesh: train,
          speed: lane.speed,
          length: train.userData.hitLength || 22,
          width: 1.4,
          type: 'TRAIN'
        });
      }
    } else if (lane.railState === 'TRAIN') {
      // Move train
      let trainAlive = false;
      for (let i = lane.movingItems.length - 1; i >= 0; i--) {
        const item = lane.movingItems[i];
        item.mesh.position.x += item.speed * dt;

        if ((lane.direction > 0 && item.mesh.position.x > 38) ||
            (lane.direction < 0 && item.mesh.position.x < -38)) {
          lane.group.remove(item.mesh);
          lane.movingItems.splice(i, 1);
        } else {
          trainAlive = true;
        }
      }

      if (!trainAlive) {
        // Train finished pass, reset to idle
        lane.railState = 'IDLE';
        lane.railTimer = 6 + Math.random() * 9;
        // Turn off warning lamps
        lane.railSignals.forEach(sig => {
          if (sig.userData.lampLeft && sig.userData.lampRight) {
            sig.userData.lampLeft.material = Materials.railSignalOff;
            sig.userData.lampRight.material = Materials.railSignalOff;
          }
        });
      }
    }
  }

  removeLane(rowIndex) {
    const lane = this.lanes.get(rowIndex);
    if (!lane) return;

    this.scene.remove(lane.group);
    // Cleanup items
    lane.movingItems.length = 0;
    lane.obstacles.clear();
    this.lanes.delete(rowIndex);

    // Remove any coins in this row
    this.coins = this.coins.filter(c => c.rowIndex !== rowIndex);
  }

  // Check collision for player stepping into static obstacle
  isBlocked(targetCol, targetRow) {
    // World bounds check
    if (targetCol < MIN_COL || targetCol > MAX_COL) return true;

    const lane = this.lanes.get(targetRow);
    if (!lane) return false;

    return lane.obstacles.has(targetCol);
  }

  // Check if player position hits any vehicle or train
  checkVehicleCollision(playerX, playerZ, playerRadius = 0.35) {
    const row = Math.round(playerZ / STEP);
    const lane = this.lanes.get(row);
    if (!lane || (lane.type !== 'ROAD' && lane.type !== 'RAIL')) return null;

    for (const item of lane.movingItems) {
      const halfLen = item.length / 2;
      const halfWid = item.width / 2;
      const itemX = item.mesh.position.x;
      const itemZ = lane.z;

      // AABB overlap check with player circle/box
      const minX = itemX - halfLen;
      const maxX = itemX + halfLen;
      const minZ = itemZ - halfWid;
      const maxZ = itemZ + halfWid;

      if (
        playerX + playerRadius > minX &&
        playerX - playerRadius < maxX &&
        playerZ + playerRadius > minZ &&
        playerZ - playerRadius < maxZ
      ) {
        return item;
      }
    }
    return null;
  }

  // Check if player is on water and whether they are standing safely on a log
  checkWaterStatus(playerX, playerZ, playerRadius = 0.3) {
    const row = Math.round(playerZ / STEP);
    const lane = this.lanes.get(row);
    if (!lane || lane.type !== 'RIVER') return { isRiver: false, onLog: false, logSpeed: 0 };

    for (const log of lane.movingItems) {
      const halfLen = log.length / 2 + 0.15; // Generous margin for player satisfaction
      const halfWid = log.width / 2 + 0.15;
      const logX = log.mesh.position.x;
      const logZ = lane.z;

      if (
        playerX >= logX - halfLen &&
        playerX <= logX + halfLen &&
        Math.abs(playerZ - logZ) <= halfWid
      ) {
        return { isRiver: true, onLog: true, logSpeed: log.speed, logMesh: log.mesh };
      }
    }

    return { isRiver: true, onLog: false, logSpeed: 0 };
  }

  // Collect coin if in proximity
  checkCoinCollection(playerX, playerZ, radius = 0.75) {
    for (const c of this.coins) {
      if (c.collected) continue;
      const dx = playerX - c.x;
      const dz = playerZ - c.z;
      if (dx * dx + dz * dz < radius * radius) {
        c.collected = true;
        if (c.mesh.parent) {
          c.mesh.parent.remove(c.mesh);
        }
        return c;
      }
    }
    return null;
  }
}
