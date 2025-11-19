import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

export class NeuronSystem {
    constructor(scene) {
        this.scene = scene;
        this.particlesData = [];
        this.pointsSystem = null;
        
        // SETTINGS
        this.particleCount = 2000; // Tons of particles
        this.particleSize = 0.05;  // Tiny size
        this.speed = 0.005;        // Movement speed
        this.color = 0x00ffff;     // Cyan/Electric Blue
    }

    // This generates a soft circular glow texture automatically
    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');   // Center is white
        grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)'); // Mid is semi-transparent
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');         // Edge is transparent

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    init(brainMesh) {
        // 1. Setup the Sampler (finds points on the brain surface)
        const sampler = new MeshSurfaceSampler(brainMesh).build();
        const tempPosition = new THREE.Vector3();

        // 2. Prepare Geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // 3. Create Paths
        for (let i = 0; i < this.particleCount; i++) {
            // Start point
            sampler.sample(tempPosition);
            const start = tempPosition.clone();

            // End point
            sampler.sample(tempPosition);
            const end = tempPosition.clone();

            // Curve (arc outwards slightly)
            const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(start.length() * 1.05);
            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);

            // Save data for animation
            this.particlesData.push({
                curve: curve,
                progress: Math.random(), // Random start time
                speed: (Math.random() * 0.005) + 0.002 // Random variation in speed
            });
        }

        // 4. Create Material (Using the Circle Texture!)
        const material = new THREE.PointsMaterial({
            color: this.color,
            size: this.particleSize,
            map: this.createCircleTexture(), // <--- This makes them round
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending, // Makes them glow when overlapping
            depthWrite: false
        });

        // 5. Add to Scene
        this.pointsSystem = new THREE.Points(geometry, material);
        this.scene.add(this.pointsSystem);
    }

    update() {
        if (!this.pointsSystem) return;

        const positions = this.pointsSystem.geometry.attributes.position.array;

        for (let i = 0; i < this.particlesData.length; i++) {
            const data = this.particlesData[i];

            // Advance particle
            data.progress += data.speed;
            if (data.progress > 1) data.progress = 0;

            // Get position on curve
            const point = data.curve.getPoint(data.progress);

            // Update geometry
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }

        this.pointsSystem.geometry.attributes.position.needsUpdate = true;
    }
}