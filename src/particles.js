import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Reusable geometries
    this.boxGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.smallBoxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    this.sphereGeo = new THREE.SphereGeometry(0.12, 6, 6);

    // Reusable materials
    this.dustMat = new THREE.MeshLambertMaterial({ 
      color: 0xcccccc, 
      transparent: true, 
      opacity: 0.8 
    });
    this.waterMat = new THREE.MeshLambertMaterial({ 
      color: 0x4fc3f7, 
      transparent: true, 
      opacity: 0.85 
    });
    this.coinMat = new THREE.MeshBasicMaterial({ 
      color: 0xffd700, 
      transparent: true, 
      opacity: 1.0 
    });
    this.featherMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
  }

  // Puff of dust when landing a hop
  createHopDust(pos) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = 0.8 + Math.random() * 0.6;
      const mesh = new THREE.Mesh(this.smallBoxGeo, this.dustMat.clone());
      mesh.position.set(pos.x, 0.08, pos.z);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.8 + Math.random() * 0.8,
          Math.sin(angle) * speed
        ),
        gravity: -5.0,
        rotSpeed: new THREE.Vector3(Math.random() * 5, Math.random() * 5, 0),
        life: 0.35,
        maxLife: 0.35,
        scaleSpeed: -2.0,
      });
    }
  }

  // Water splash when drowning
  createSplash(pos) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.4;
      const speed = 1.2 + Math.random() * 1.5;
      const mesh = new THREE.Mesh(this.sphereGeo, this.waterMat.clone());
      mesh.position.set(pos.x + Math.cos(angle) * dist, 0.1, pos.z + Math.sin(angle) * dist);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          3.0 + Math.random() * 2.5,
          Math.sin(angle) * speed
        ),
        gravity: -12.0,
        life: 0.7,
        maxLife: 0.7,
        scaleSpeed: -1.2,
      });
    }
  }

  // Explosive voxel burst when hit by vehicle or train
  createVoxelBurst(pos, colors = [0xffffff, 0xd50000, 0xffb300]) {
    const count = 28;
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(this.boxGeo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.6,
        pos.y + Math.random() * 0.6,
        pos.z + (Math.random() - 0.5) * 0.6
      );
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const spread = 2.0 + Math.random() * 3.5;
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * spread,
          3.5 + Math.random() * 4.0,
          Math.sin(angle) * spread
        ),
        gravity: -15.0,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        ),
        life: 1.2,
        maxLife: 1.2,
        scaleSpeed: -0.6,
      });
    }
  }

  // Coin sparkle rings
  createCoinSparkle(pos) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.0;
      const mesh = new THREE.Mesh(this.smallBoxGeo, this.coinMat.clone());
      mesh.position.set(pos.x, pos.y, pos.z);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          1.8 + Math.random() * 1.2,
          Math.sin(angle) * speed
        ),
        gravity: -6.0,
        life: 0.5,
        maxLife: 0.5,
        scaleSpeed: -1.5,
      });
    }
  }

  // Feathers fluttering when eagle snatches
  createFeathers(pos) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.boxGeo, this.featherMat.clone());
      mesh.scale.set(0.6, 0.1, 1.2);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.8,
        pos.y + (Math.random() - 0.5) * 0.8,
        pos.z + (Math.random() - 0.5) * 0.8
      );
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 2.0,
          1.0 + Math.random() * 1.5,
          (Math.random() - 0.5) * 2.0
        ),
        gravity: -1.5, // Feathers drift slowly
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ),
        life: 1.5,
        maxLife: 1.5,
        scaleSpeed: -0.4,
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.material && p.mesh.material.dispose) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.vel.y += p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);

      // Bounce on ground if not in water
      if (p.mesh.position.y < 0.05 && p.vel.y < 0) {
        p.mesh.position.y = 0.05;
        p.vel.y *= -0.35;
        p.vel.x *= 0.6;
        p.vel.z *= 0.6;
      }

      // Rotation
      if (p.rotSpeed) {
        p.mesh.rotation.x += p.rotSpeed.x * dt;
        p.mesh.rotation.y += p.rotSpeed.y * dt;
        p.mesh.rotation.z += p.rotSpeed.z * dt;
      }

      // Opacity fade & scale shrink
      const progress = p.life / p.maxLife;
      if (p.mesh.material) {
        p.mesh.material.opacity = progress;
      }
      const newScale = Math.max(0.01, p.mesh.scale.x + p.scaleSpeed * dt);
      p.mesh.scale.set(newScale, newScale, newScale);
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.material && p.mesh.material.dispose) {
        p.mesh.material.dispose();
      }
    }
    this.particles = [];
  }
}
