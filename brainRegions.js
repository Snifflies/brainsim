import * as THREE from 'three';

// COORDINATES: Where the regions are located relative to the center.
// Since we don't know the exact scale of your brain model, 
// I have made the radius generous so the colors definitely show up.
const REGIONS = {
    "Frontal Lobe":       { x: 0,    y: 2,    z: 3,    radius: 4.0 }, // Front/Top
    "Prefrontal Cortex":  { x: 0,    y: -1,   z: 4,    radius: 3.5 }, // Very Front
    "Parietal Lobe":      { x: 0,    y: 4,    z: -2,   radius: 3.5 }, // Top/Back
    "Occipital Lobe":     { x: 0,    y: 0,    z: -5,   radius: 3.5 }, // Very Back
    "Temporal Lobe (L)":  { x: -3.5, y: -2,   z: 0,    radius: 3.0 }, // Left Side
    "Temporal Lobe (R)":  { x: 3.5,  y: -2,   z: 0,    radius: 3.0 }, // Right Side
    "Cerebellum":         { x: 0,    y: -3,   z: -3.5, radius: 2.5 }, // Bottom Back
    "Brain Stem":         { x: 0,    y: -5,   z: -1,   radius: 2.0 }  // Bottom Center
};

// COLORS
const COLOR_BASE = new THREE.Color(0xffb6c1);   // Pale Pink
const COLOR_ACTIVE = new THREE.Color(0xff0055); // Hot Pink

export class BrainRegionManager {
    constructor() {
        this.brainMesh = null;
    }

    setup(mesh) {
        this.brainMesh = mesh;
        
        // 1. Prepare the mesh for painting
        // We need to ensure the material supports "Vertex Colors"
        this.brainMesh.material = new THREE.MeshStandardMaterial({
            vertexColors: true, // ENABLE PAINTING
            roughness: 0.5,
            metalness: 0.1,
            color: 0xffffff // White base, so vertex colors show true
        });

        // 2. Create the color buffer
        const geometry = this.brainMesh.geometry;
        const count = geometry.attributes.position.count;
        const colors = new Float32Array(count * 3);
        
        // Fill with base pink initially
        for (let i = 0; i < count; i++) {
            colors[i * 3] = COLOR_BASE.r;
            colors[i * 3 + 1] = COLOR_BASE.g;
            colors[i * 3 + 2] = COLOR_BASE.b;
        }

        // Attach colors to geometry
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    highlightRegion(regionName) {
        if (!this.brainMesh) return;

        const geometry = this.brainMesh.geometry;
        const positions = geometry.attributes.position;
        const colors = geometry.attributes.color;
        const count = positions.count;

        // If "Whole Brain" selected, reset to pink
        if (!REGIONS[regionName]) {
            for (let i = 0; i < count; i++) {
                colors.setXYZ(i, COLOR_BASE.r, COLOR_BASE.g, COLOR_BASE.b);
            }
            colors.needsUpdate = true;
            return;
        }

        // Get Target Zone
        const zone = REGIONS[regionName];
        const targetVec = new THREE.Vector3(zone.x, zone.y, zone.z);
        const tempVec = new THREE.Vector3();

        // Loop through every single vertex
        for (let i = 0; i < count; i++) {
            tempVec.fromBufferAttribute(positions, i);
            
            // Check distance
            const dist = tempVec.distanceTo(targetVec);

            if (dist < zone.radius) {
                // Inside the zone -> Paint RED
                // We add a soft edge (lerp) so it's not a harsh line
                let intensity = 1 - (dist / zone.radius); 
                intensity = Math.pow(intensity, 0.5); // Make the center stronger

                const r = THREE.MathUtils.lerp(COLOR_BASE.r, COLOR_ACTIVE.r, intensity);
                const g = THREE.MathUtils.lerp(COLOR_BASE.g, COLOR_ACTIVE.g, intensity);
                const b = THREE.MathUtils.lerp(COLOR_BASE.b, COLOR_ACTIVE.b, intensity);
                
                colors.setXYZ(i, r, g, b);
            } else {
                // Outside -> Paint Pink
                colors.setXYZ(i, COLOR_BASE.r, COLOR_BASE.g, COLOR_BASE.b);
            }
        }

        colors.needsUpdate = true;
    }

    getRegionList() {
        return Object.keys(REGIONS);
    }
}
