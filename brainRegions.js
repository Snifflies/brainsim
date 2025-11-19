import * as THREE from 'three';

// Approximate coordinates for brain regions relative to the center (0,0,0)
// You may need to tweak these numbers depending on your specific model's rotation/size
const REGIONS = {
    "Frontal Lobe": { x: 0, y: 1, z: 2, radius: 2.5 },
    "Prefrontal Cortex": { x: 0, y: 0, z: 3, radius: 1.8 },
    "Parietal Lobe": { x: 0, y: 3, z: -0.5, radius: 2.0 },
    "Occipital Lobe": { x: 0, y: 0, z: -3.5, radius: 2.0 },
    "Temporal Lobe (Left)": { x: -2.5, y: -0.5, z: 0.5, radius: 1.8 },
    "Temporal Lobe (Right)": { x: 2.5, y: -0.5, z: 0.5, radius: 1.8 },
    "Cerebellum": { x: 0, y: -2, z: -2.5, radius: 1.8 },
    "Brain Stem": { x: 0, y: -3.5, z: -0.5, radius: 1.5 }
};

// Colors
const COLOR_BASE = new THREE.Color(0xffb6c1); // Light Pink
const COLOR_ACTIVE = new THREE.Color(0xcc0055); // Dark Deep Pink

export class BrainRegionManager {
    constructor() {
        this.brainMesh = null;
        this.originalColors = null;
    }

    setup(mesh) {
        this.brainMesh = mesh;

        // 1. Ensure the mesh can handle Vertex Colors
        // We replace the texture material with a vertex-colored material
        // This allows us to paint individual polygons
        const geometry = this.brainMesh.geometry;
        
        // Count vertices
        const count = geometry.attributes.position.count;
        
        // Create a color buffer
        const colors = new Float32Array(count * 3);
        
        // Fill with Base Color initially
        for (let i = 0; i < count; i++) {
            colors[i * 3] = COLOR_BASE.r;
            colors[i * 3 + 1] = COLOR_BASE.g;
            colors[i * 3 + 2] = COLOR_BASE.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Update material to use these colors
        this.brainMesh.material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.4,
            metalness: 0.1,
            transparent: true,
            opacity: 1.0
        });
    }

    highlightRegion(regionName) {
        if (!this.brainMesh) return;
        
        const geometry = this.brainMesh.geometry;
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        const count = positions.count;

        // If "All" or "None" is selected, reset to pink
        if (!REGIONS[regionName]) {
            for (let i = 0; i < count; i++) {
                colors.setXYZ(i, COLOR_BASE.r, COLOR_BASE.g, COLOR_BASE.b);
            }
            colors.needsUpdate = true;
            return;
        }

        // Get target data
        const target = REGIONS[regionName];
        const targetVec = new THREE.Vector3(target.x, target.y, target.z);
        const tempVec = new THREE.Vector3();

        // Loop through every vertex in the brain
        for (let i = 0; i < count; i++) {
            tempVec.fromBufferAttribute(positions, i);
            
            // Calculate distance from this part of the brain to the Region Center
            const dist = tempVec.distanceTo(targetVec);

            if (dist < target.radius) {
                // Inside the region -> Dark Pink
                // We create a soft gradient at the edge
                const alpha = 1 - (dist / target.radius); // 1 at center, 0 at edge
                
                // Mix base color and active color
                const r = THREE.MathUtils.lerp(COLOR_BASE.r, COLOR_ACTIVE.r, alpha);
                const g = THREE.MathUtils.lerp(COLOR_BASE.g, COLOR_ACTIVE.g, alpha);
                const b = THREE.MathUtils.lerp(COLOR_BASE.b, COLOR_ACTIVE.b, alpha);
                
                colors.setXYZ(i, r, g, b);
            } else {
                // Outside -> Base Pink
                colors.setXYZ(i, COLOR_BASE.r, COLOR_BASE.g, COLOR_BASE.b);
            }
        }

        colors.needsUpdate = true;
    }
    
    getRegionList() {
        return Object.keys(REGIONS);
    }
}