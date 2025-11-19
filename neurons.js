import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

export class NeuronSystem {
    constructor(scene) {
        this.scene = scene;
        this.particlesData = [];
        this.pointsSystem = null;
        this.particleCount = 2000; 
        this.particleSize = 0.04;
        this.speed = 0.002;
        this.color = 0x00ffff;
        this.visible = false; // HIDDEN BY DEFAULT
    }

    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    init(brainMesh) {
        const sampler = new MeshSurfaceSampler(brainMesh).build();
        const tempPosition = new THREE.Vector3();
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        for (let i = 0; i < this.particleCount; i++) {
            sampler.sample(tempPosition);
            const start = tempPosition.clone();
            sampler.sample(tempPosition);
            const end = tempPosition.clone();

            // FIX: Tighter curves so they don't fly off screen
            // We find the distance between start and end, and only arc up a tiny bit
            const distance = start.distanceTo(end);
            const mid = start.clone().add(end).multiplyScalar(0.5);
            // Push the midpoint out continuously based on surface normal would be best, 
            // but pushing away from center (0,0,0) works for a brain shape.
            const direction = mid.clone().normalize();
            mid.add(direction.multiplyScalar(distance * 0.2)); // Lower arc height

            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

            this.particlesData.push({
                curve: curve,
                progress: Math.random(),
                speed: (Math.random() * 0.002) + 0.001
            });
        }

        const material = new THREE.PointsMaterial({
            color: this.color,
            size: this.particleSize,
            map: this.createCircleTexture(),
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            visible: this.visible // Apply visibility setting
        });

        this.pointsSystem = new THREE.Points(geometry, material);
        this.scene.add(this.pointsSystem);
    }

    toggleVisibility(isVisible) {
        if (this.pointsSystem) {
            this.pointsSystem.material.visible = isVisible;
        }
    }

    update() {
        if (!this.pointsSystem || !this.pointsSystem.material.visible) return;

        const positions = this.pointsSystem.geometry.attributes.position.array;

        for (let i = 0; i < this.particlesData.length; i++) {
            const data = this.particlesData[i];
            data.progress += data.speed;
            if (data.progress > 1) data.progress = 0;
            const point = data.curve.getPoint(data.progress);
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }
        this.pointsSystem.geometry.attributes.position.needsUpdate = true;
    }
}