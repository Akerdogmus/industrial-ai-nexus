import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModel3DProps {
    status: 'normal' | 'warning' | 'critical';
}

// Industrial Machine Model Component
function IndustrialMachine({ status }: { status: 'normal' | 'warning' | 'critical' }) {
    const groupRef = useRef<THREE.Group>(null);

    // Slow rotation animation
    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.3;
        }
    });

    // Color based on status
    const getColor = () => {
        switch (status) {
            case 'critical': return '#ef4444';
            case 'warning': return '#fbbf24';
            default: return '#4ade80';
        }
    };

    const statusColor = getColor();

    return (
        <group ref={groupRef}>
            {/* Base Platform */}
            <mesh position={[0, -1.2, 0]}>
                <boxGeometry args={[3, 0.3, 2]} />
                <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Main Body (Motor Housing) */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.8, 0.9, 2, 32]} />
                <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.4} />
            </mesh>

            {/* Rotating Shaft */}
            <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Status Indicator Light */}
            <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial
                    color={statusColor}
                    emissive={statusColor}
                    emissiveIntensity={1.5}
                />
            </mesh>

            {/* Cooling Fins */}
            {[0, 1, 2, 3, 4, 5].map((i) => (
                <mesh
                    key={i}
                    position={[
                        Math.cos((i / 6) * Math.PI * 2) * 0.95,
                        0,
                        Math.sin((i / 6) * Math.PI * 2) * 0.95
                    ]}
                    rotation={[0, (i / 6) * Math.PI * 2, 0]}
                >
                    <boxGeometry args={[0.1, 1.5, 0.05]} />
                    <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.5} />
                </mesh>
            ))}

            {/* Sensor Box (Vibration) */}
            <mesh position={[1, 0.3, 0]}>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.6} />
            </mesh>

            {/* Sensor Box (Temperature) */}
            <mesh position={[-1, 0.3, 0]}>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.6} />
            </mesh>

            {/* Control Panel */}
            <mesh position={[0.6, -0.5, 0.95]} rotation={[0.3, 0, 0]}>
                <boxGeometry args={[0.5, 0.4, 0.05]} />
                <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.8} />
            </mesh>
        </group>
    );
}

const MachineModel3D: React.FC<MachineModel3DProps> = ({ status }) => {
    return (
        <div style={{
            width: '100%',
            height: '250px',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <Canvas
                camera={{ position: [3, 2, 4], fov: 45 }}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <pointLight position={[-5, 5, -5]} intensity={0.5} color="#60a5fa" />

                {/* Machine Model */}
                <IndustrialMachine status={status} />

                {/* Controls */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={false}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 4}
                />
            </Canvas>
        </div>
    );
};

export default MachineModel3D;
