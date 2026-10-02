import * as THREE from 'three';
import { createPlayerModel, createEagle } from './models.js';
import { ParticleSystem } from './particles.js';
import { WorldManager, STEP, MIN_COL, MAX_COL } from './world.js';
import { sounds } from './audio.js';

export const GameState = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
};

export class CrossyGame {
  constructor(canvasContainer, uiCallbacks) {
    this.container = canvasContainer;
    this.ui = uiCallbacks;

    this.state = GameState.READY;
    this.score = 0;
    this.coinsCollected = 0;
    this.maxRowReached = 0;
    this.bestScore = parseInt(localStorage.getItem('crossy_best_score') || '0', 10);

    // Grid coordinates
    this.playerCol = 0;
    this.playerRow = 0;
    this.targetCol = 0;
    this.targetRow = 0;

    // Smooth movement state
    this.isHopping = false;
    this.hopProgress = 0;
    this.hopDuration = 0.16; // Snappy 160ms hop
    this.hopStartPos = new THREE.Vector3();
    this.hopEndPos = new THREE.Vector3();
    this.playerFacing = 0; // Target Y rotation
    this.currentFacing = 0;

    // Buffer one input during hop for fluid responsiveness
    this.bufferedMove = null;

    // Eagle anti-afk timer
    this.afkTimer = 0;
    this.maxAfkTime = 8.5; // Eagle swoops after 8.5s idle
    this.eagleActive = false;
    this.eagleMesh = null;
    this.eagleProgress = 0;
    this.eagleStartPos = new THREE.Vector3();
    this.eagleEndPos = new THREE.Vector3();

    // Camera shake
    this.shakeIntensity = 0;

    // Setup Three.js
    this.initThree();
    this.initLights();
    this.particles = new ParticleSystem(this.scene);
    this.world = new WorldManager(this.scene, this.particles);

    // Create player
    this.player = createPlayerModel();
    this.scene.add(this.player);

    // Setup listeners
    this.initControls();
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    // Start in READY state
    this.reset();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb2ebf2); // Crisp sky cyan
    this.scene.fog = new THREE.Fog(0xb2ebf2, 35, 60);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    
    // Orthographic camera for authentic voxel arcade isometric view
    const viewSize = 14;
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect,
      viewSize * aspect,
      viewSize,
      -viewSize,
      0.1,
      100
    );

    // Isometric angle: 45 degree tilt and angle
    this.cameraOffset = new THREE.Vector3(-14, 20, -14);
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Ambient soft fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Hemisphere sky/ground contrast
    const hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x8bc34a, 0.4);
    this.scene.add(hemiLight);

    // Directional sunlight casting crisp shadows
    this.dirLight = new THREE.DirectionalLight(0xfffde7, 0.85);
    this.dirLight.position.set(-20, 32, -15);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 70;

    const d = 22;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
  }

  initControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      // Prevent scrolling on arrows & space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (this.state === GameState.READY) {
        this.start();
      } else if (this.state === GameState.GAMEOVER) {
        if (e.key === ' ' || e.key === 'Enter') {
          this.reset();
          this.start();
          return;
        }
      }

      if (this.state !== GameState.PLAYING) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.handleMove('FORWARD');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.handleMove('BACKWARD');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.handleMove('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.handleMove('RIGHT');
          break;
      }
    });

    // Touch & Mouse Swipe / Tap
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onPointerDown = (clientX, clientY) => {
      touchStartX = clientX;
      touchStartY = clientY;
      touchStartTime = performance.now();
    };

    const onPointerUp = (clientX, clientY) => {
      const dx = clientX - touchStartX;
      const dy = clientY - touchStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = performance.now() - touchStartTime;

      if (this.state === GameState.READY) {
        this.start();
        return;
      }

      if (this.state !== GameState.PLAYING) return;

      if (dist < 15 && elapsed < 350) {
        // Quick tap = hop forward!
        this.handleMove('FORWARD');
      } else if (dist >= 20) {
        // Swipe detected
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal
          if (dx > 0) this.handleMove('RIGHT');
          else this.handleMove('LEFT');
        } else {
          // Vertical
          if (dy < 0) this.handleMove('FORWARD');
          else this.handleMove('BACKWARD');
        }
      }
    };

    this.container.addEventListener('pointerdown', (e) => onPointerDown(e.clientX, e.clientY));
    this.container.addEventListener('pointerup', (e) => onPointerUp(e.clientX, e.clientY));
  }

  // External control triggers (e.g. on-screen buttons)
  triggerMove(dir) {
    if (this.state === GameState.READY) {
      this.start();
    }
    if (this.state === GameState.PLAYING) {
      this.handleMove(dir);
    }
  }

  reset() {
    this.state = GameState.READY;
    this.score = 0;
    this.coinsCollected = 0;
    this.maxRowReached = 0;
    this.playerCol = 0;
    this.playerRow = 0;
    this.targetCol = 0;
    this.targetRow = 0;
    this.isHopping = false;
    this.hopProgress = 0;
    this.bufferedMove = null;
    this.afkTimer = 0;
    this.eagleActive = false;
    this.shakeIntensity = 0;

    // Reset eagle
    if (this.eagleMesh) {
      this.scene.remove(this.eagleMesh);
      this.eagleMesh = null;
    }

    // Reset player transform
    this.player.position.set(0, 0, 0);
    this.playerFacing = 0;
    this.currentFacing = 0;
    this.player.rotation.set(0, 0, 0);
    this.player.scale.set(1, 1, 1);
    this.player.visible = true;

    if (this.player.userData.bodyRoot) {
      this.player.userData.bodyRoot.scale.set(1, 1, 1);
      this.player.userData.bodyRoot.position.y = 0.5;
    }

    // Reset world & particles
    this.particles.clear();
    this.world.init();

    // Reset camera position directly on player
    this.updateCamera(0, true);

    // Update UI
    this.ui.onScoreUpdate(this.score, this.bestScore, this.coinsCollected);
    this.ui.onStateChange(this.state);
  }

  start() {
    if (this.state === GameState.READY) {
      this.state = GameState.PLAYING;
      this.afkTimer = 0;
      sounds.playClick();
      this.ui.onStateChange(this.state);
    }
  }

  pause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.ui.onStateChange(this.state);
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.ui.onStateChange(this.state);
    }
  }

  handleMove(direction) {
    if (this.state !== GameState.PLAYING) return;

    if (this.isHopping) {
      // Buffer move
      this.bufferedMove = direction;
      return;
    }

    let nextCol = this.playerCol;
    let nextRow = this.playerRow;
    let targetAngle = 0;

    switch (direction) {
      case 'FORWARD':
        nextRow += 1;
        targetAngle = 0;
        break;
      case 'BACKWARD':
        // Don't allow hopping too far back behind camera
        if (nextRow <= this.maxRowReached - 6) return;
        nextRow -= 1;
        targetAngle = Math.PI;
        break;
      case 'LEFT':
        nextCol -= 1;
        targetAngle = Math.PI / 2;
        break;
      case 'RIGHT':
        nextCol += 1;
        targetAngle = -Math.PI / 2;
        break;
    }

    // Check obstacle blockage
    if (this.world.isBlocked(nextCol, nextRow)) {
      // Obstacle hit sound (soft thud) and slight head turn
      this.playerFacing = targetAngle;
      return;
    }

    // Initiate Hop!
    this.targetCol = nextCol;
    this.targetRow = nextRow;
    this.playerFacing = targetAngle;
    this.isHopping = true;
    this.hopProgress = 0;
    this.afkTimer = 0; // Reset eagle AFK timer

    this.hopStartPos.copy(this.player.position);
    this.hopEndPos.set(nextCol * STEP, 0, nextRow * STEP);

    sounds.playHop();
  }

  finishHop() {
    this.isHopping = false;
    this.playerCol = this.targetCol;
    this.playerRow = this.targetRow;
    this.player.position.set(this.targetCol * STEP, 0, this.targetRow * STEP);

    // Dust puff particle on landing
    this.particles.createHopDust(this.player.position);

    // Update score if new row reached
    if (this.playerRow > this.maxRowReached) {
      this.maxRowReached = this.playerRow;
      this.updateScore();
    }

    // Check coin pickup
    const coin = this.world.checkCoinCollection(this.player.position.x, this.player.position.z);
    if (coin) {
      this.coinsCollected++;
      sounds.playCoin();
      this.particles.createCoinSparkle(coin.mesh.position);
      this.updateScore();
      this.ui.onCoinCollect();
    }

    // Check instant water death (if landed directly on river with no log)
    const waterCheck = this.world.checkWaterStatus(this.player.position.x, this.player.position.z);
    if (waterCheck.isRiver && !waterCheck.onLog) {
      this.die('WATER');
      return;
    }

    // Execute buffered move if any
    if (this.bufferedMove) {
      const nextMove = this.bufferedMove;
      this.bufferedMove = null;
      this.handleMove(nextMove);
    }
  }

  updateScore() {
    this.score = this.maxRowReached + (this.coinsCollected * 5);
    let isNewBest = false;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('crossy_best_score', this.bestScore.toString());
      isNewBest = true;
    }

    this.ui.onScoreUpdate(this.score, this.bestScore, this.coinsCollected, isNewBest);
  }

  die(cause) {
    if (this.state === GameState.GAMEOVER) return;
    this.state = GameState.GAMEOVER;
    this.isHopping = false;
    this.bufferedMove = null;

    if (cause === 'VEHICLE' || cause === 'TRAIN') {
      sounds.playCrash();
      this.shakeIntensity = cause === 'TRAIN' ? 1.0 : 0.6;

      // Flatten player & create voxel debris burst
      if (this.player.userData.bodyRoot) {
        this.player.userData.bodyRoot.scale.set(1.3, 0.15, 1.3);
        this.player.userData.bodyRoot.position.y = 0.08;
      }
      this.particles.createVoxelBurst(this.player.position);
    } else if (cause === 'WATER') {
      sounds.playSplash();
      this.particles.createSplash(this.player.position);

      // Sink player into water
      this.player.position.y = -0.5;
      this.player.visible = false;
    } else if (cause === 'EAGLE') {
      sounds.playEagle();
      this.particles.createFeathers(this.player.position);
      // Eagle grabs player
    }

    sounds.playGameOver();

    // Trigger game over UI after short delay for impact
    setTimeout(() => {
      this.ui.onGameOver({
        score: this.score,
        bestScore: this.bestScore,
        distance: this.maxRowReached,
        coins: this.coinsCollected,
        isNewBest: this.score === this.bestScore && this.score > 0
      });
    }, 850);
  }

  triggerEagleSwoop() {
    if (this.eagleActive || this.state !== GameState.PLAYING) return;
    this.eagleActive = true;
    this.eagleProgress = 0;

    this.eagleMesh = createEagle();
    this.scene.add(this.eagleMesh);

    // Eagle swoops from top-back to player position and out to top-front
    const p = this.player.position;
    this.eagleStartPos.set(p.x, p.y + 18, p.z - 20);
    this.eagleEndPos.set(p.x, p.y + 14, p.z + 24);
    this.eagleMesh.position.copy(this.eagleStartPos);

    sounds.playEagle();
  }

  update(dt) {
    // Cap delta time to prevent large steps on tab switch
    dt = Math.min(dt, 0.1);

    // Update world objects (vehicles, logs, trains)
    this.world.update(dt, this.playerRow);

    // Update particles
    this.particles.update(dt);

    if (this.state === GameState.READY) {
      // Cute idle breathing/pecking animation
      const time = performance.now() * 0.005;
      if (this.player.userData.bodyRoot) {
        this.player.userData.bodyRoot.scale.y = 1 + Math.sin(time) * 0.06;
        this.player.userData.bodyRoot.rotation.x = Math.sin(time * 0.5) * 0.05;
      }
      this.updateCamera(dt);
      return;
    }

    if (this.state === GameState.PLAYING) {
      // AFK eagle countdown
      this.afkTimer += dt;
      if (this.afkTimer >= this.maxAfkTime && !this.eagleActive) {
        this.triggerEagleSwoop();
      }

      // Handle hopping interpolation
      if (this.isHopping) {
        this.hopProgress += dt / this.hopDuration;
        const p = Math.min(1.0, this.hopProgress);

        // Linear horizontal interpolation
        this.player.position.lerpVectors(this.hopStartPos, this.hopEndPos, p);

        // Parabolic vertical hop arc: sin(p * PI)
        const hopHeight = 1.1;
        this.player.position.y = Math.sin(p * Math.PI) * hopHeight;

        // Wing flapping during hop
        if (this.player.userData.leftWing && this.player.userData.rightWing) {
          const wingAngle = Math.sin(p * Math.PI) * 0.7;
          this.player.userData.leftWing.rotation.z = wingAngle;
          this.player.userData.rightWing.rotation.z = -wingAngle;
        }

        // Squash & stretch dynamics
        if (this.player.userData.bodyRoot) {
          if (p < 0.5) {
            // Ascending: stretch tall
            this.player.userData.bodyRoot.scale.set(0.9, 1.15, 0.9);
          } else {
            // Descending: return to normal
            this.player.userData.bodyRoot.scale.set(1.0, 1.0, 1.0);
          }
        }

        if (this.hopProgress >= 1.0) {
          this.finishHop();
        }
      } else {
        // Not hopping: wings resting
        if (this.player.userData.leftWing && this.player.userData.rightWing) {
          this.player.userData.leftWing.rotation.z = 0;
          this.player.userData.rightWing.rotation.z = 0;
        }
        if (this.player.userData.bodyRoot) {
          this.player.userData.bodyRoot.scale.set(1, 1, 1);
        }

        // Check if standing on a floating log on a River lane
        const waterStatus = this.world.checkWaterStatus(this.player.position.x, this.player.position.z);
        if (waterStatus.isRiver) {
          if (waterStatus.onLog) {
            // Player drifts along with the log
            this.player.position.x += waterStatus.logSpeed * dt;

            // Check if log drifted player off-screen
            if (this.player.position.x < (MIN_COL - 1) * STEP || this.player.position.x > (MAX_COL + 1) * STEP) {
              this.die('WATER');
            }
          } else {
            // Drowned in river!
            this.die('WATER');
          }
        }
      }

      // Smooth rotation towards target facing
      let angleDiff = this.playerFacing - this.currentFacing;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.currentFacing += angleDiff * Math.min(1.0, dt * 25);
      this.player.rotation.y = this.currentFacing;

      // Check collision with vehicles or train
      const hit = this.world.checkVehicleCollision(this.player.position.x, this.player.position.z);
      if (hit) {
        this.die(hit.type);
      }
    }

    // Eagle swoop update
    if (this.eagleActive && this.eagleMesh) {
      this.eagleProgress += dt * 1.35;
      const t = Math.min(1.0, this.eagleProgress);

      // Swoop arc: drops down to grab player, then flies up
      this.eagleMesh.position.lerpVectors(this.eagleStartPos, this.eagleEndPos, t);
      const swoopDip = Math.sin(t * Math.PI) * -12;
      this.eagleMesh.position.y = THREE.MathUtils.lerp(this.eagleStartPos.y, this.eagleEndPos.y, t) + swoopDip;

      // Eagle wings flap
      const flap = Math.sin(performance.now() * 0.02) * 0.5;
      if (this.eagleMesh.userData.leftWing) this.eagleMesh.userData.leftWing.rotation.z = flap;
      if (this.eagleMesh.userData.rightWing) this.eagleMesh.userData.rightWing.rotation.z = -flap;

      // Contact point: snatch player
      if (t >= 0.48 && this.state === GameState.PLAYING) {
        this.die('EAGLE');
      }

      if (this.state === GameState.GAMEOVER && t >= 0.48) {
        // Player carried by eagle!
        this.player.position.copy(this.eagleMesh.position);
        this.player.position.y -= 0.6;
      }

      if (t >= 1.0) {
        this.scene.remove(this.eagleMesh);
        this.eagleMesh = null;
        this.eagleActive = false;
      }
    }

    // Camera following & shake
    this.updateCamera(dt);
  }

  updateCamera(dt, instant = false) {
    // Camera targets player center-forward
    const targetX = this.player.position.x * 0.25;
    const targetZ = this.player.position.z;
    const targetPos = new THREE.Vector3(
      targetX + this.cameraOffset.x,
      this.cameraOffset.y,
      targetZ + this.cameraOffset.z
    );

    // Camera shake calculation
    if (this.shakeIntensity > 0) {
      targetPos.x += (Math.random() - 0.5) * this.shakeIntensity * 1.5;
      targetPos.y += (Math.random() - 0.5) * this.shakeIntensity * 1.5;
      targetPos.z += (Math.random() - 0.5) * this.shakeIntensity * 1.5;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.0);
    }

    if (instant) {
      this.camera.position.copy(targetPos);
    } else {
      this.camera.position.lerp(targetPos, Math.min(1.0, dt * 7.0));
    }

    const lookTarget = new THREE.Vector3(targetX, 0, targetZ + 3.5);
    this.camera.lookAt(lookTarget);

    // Keep sunlight moving with player so shadows stay crisp
    this.dirLight.position.set(targetX - 20, 32, targetZ - 15);
    this.dirLight.target.position.set(targetX, 0, targetZ);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    const viewSize = 14;
    this.camera.left = -viewSize * aspect;
    this.camera.right = viewSize * aspect;
    this.camera.top = viewSize;
    this.camera.bottom = -viewSize;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
