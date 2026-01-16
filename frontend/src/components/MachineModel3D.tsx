import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModel3DProps {
    status: 'normal' | 'warning' | 'critical';
}

// Premium CNC Machine Model
function IndustrialMachine({ status }: { status: 'normal' | 'warning' | 'critical' }) {
    const groupRef = useRef<THREE.Group>(null);
    const spindleRef = useRef<THREE.Mesh>(null);

    // Spindle Rotation Animation
    useFrame((state, delta) => {
        if (spindleRef.current) {
            // Rotate based on status
            spindleRef.current.rotation.y += delta * 5;
        }
        if (groupRef.current) {
            // Micro vibration for "alive" feel
            groupRef.current.position.y = -0.6 + Math.sin(state.clock.elapsedTime * 10) * 0.0005;
        }
    });

    return (
        <group ref={groupRef} position={[0, -0.6, 0]}>
            {/* ================= FLOOR PLATFORM ================= */}
            <group position={[0, -0.1, 0]}>
                <mesh receiveShadow position={[0, 0, 0]}>
                    <boxGeometry args={[4, 0.2, 3]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.7} />
                </mesh>
                {/* Safety Stripes (Yellow/Black) */}
                <mesh position={[0, 0.11, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[3.8, 0.1]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
                <mesh position={[1.9, 0.11, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
                    <planeGeometry args={[2.8, 0.1]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
                <mesh position={[-1.9, 0.11, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                    <planeGeometry args={[2.8, 0.1]} />
                    <meshStandardMaterial color="#fbbf24" />
                </mesh>
            </group>

            {/* ================= MAIN CHASSIS ================= */}
            <group position={[0, 1.1, 0]}>
                {/* Main Block */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[3, 2.2, 1.8]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.3} />
                </mesh>

                {/* Darker Side Panels */}
                <mesh position={[1.51, 0, 0]}>
                    <boxGeometry args={[0.1, 2, 1.6]} />
                    <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
                </mesh>
                <mesh position={[-1.51, 0, 0]}>
                    <boxGeometry args={[0.1, 2, 1.6]} />
                    <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
                </mesh>

                {/* Top Cap */}
                <mesh position={[0, 1.15, 0]}>
                    <boxGeometry args={[3.1, 0.2, 1.9]} />
                    <meshStandardMaterial color="#334155" metalness={0.6} />
                </mesh>
            </group>

            {/* ================= WINDOW & INTERIOR ================= */}
            <group position={[0, 1.2, 0.91]}>
                {/* Window Frame */}
                <mesh>
                    <boxGeometry args={[2.2, 1.4, 0.1]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} />
                </mesh>
                {/* Glass */}
                <mesh position={[0, 0, 0.02]}>
                    <planeGeometry args={[2, 1.2]} />
                    <meshPhysicalMaterial
                        color="#bae6fd"
                        transmission={0.9}
                        opacity={0.3}
                        metalness={0.1}
                        roughness={0}
                        clearcoat={1}
                        transparent
                    />
                </mesh>
            </group>

            {/* ================= MACHINING CENTER (INSIDE) ================= */}
            <group position={[0, 1.5, 0]}>
                {/* Spindle Head */}
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[0.6, 0.8, 0.6]} />
                    <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
                {/* Rotating Spindle */}
                <mesh ref={spindleRef} position={[0, -0.4, 0]}>
                    <cylinderGeometry args={[0.15, 0.1, 0.4, 32]} />
                    <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0.1} />
                </mesh>
                {/* Cutting Tool */}
                <mesh position={[0, -0.7, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
                    <meshStandardMaterial color="#fcd34d" metalness={1} />
                </mesh>

                {/* Workpiece on Table */}
                <mesh position={[0, -1.2, 0]}>
                    <boxGeometry args={[0.8, 0.3, 0.8]} />
                    <meshStandardMaterial color="#9ca3af" metalness={0.5} />
                </mesh>
                <mesh position={[0, -1.0, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
                    <meshStandardMaterial color="#f59e0b" metalness={0.7} />
                </mesh>
            </group>


            {/* ================= CONTROL PANEL (HMI) ================= */}
            <group position={[1.8, 1, 0.8]} rotation={[0, -0.4, 0]}>
                {/* Stand */}
                <mesh position={[0, -0.5, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
                {/* Panel Box */}
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[0.1, 0.8, 1]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.5} />
                </mesh>
                {/* Screen Glow */}
                <mesh position={[0.06, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[0.9, 0.6]} />
                    <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.8} />
                </mesh>
            </group>

            {/* ================= SIGNAL TOWER ================= */}
            <group position={[1.2, 2.3, 0.5]}>
                <mesh position={[0, -0.1, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                {/* Red */}
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
                    <meshStandardMaterial
                        color={status === 'critical' ? '#ef4444' : '#450a0a'}
                        emissive={status === 'critical' ? '#ef4444' : '#000'}
                        emissiveIntensity={status === 'critical' ? 3 : 0}
                    />
                </mesh>
                {/* Yellow */}
                <mesh position={[0, 0.08, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
                    <meshStandardMaterial
                        color={status === 'warning' ? '#fbbf24' : '#422006'}
                        emissive={status === 'warning' ? '#fbbf24' : '#000'}
                        emissiveIntensity={status === 'warning' ? 3 : 0}
                    />
                </mesh>
                {/* Green */}
                <mesh position={[0, -0.04, 0]}>
                    <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
                    <meshStandardMaterial
                        color={status === 'normal' ? '#22c55e' : '#052e16'}
                        emissive={status === 'normal' ? '#22c55e' : '#000'}
                        emissiveIntensity={status === 'normal' ? 3 : 0}
                    />
                </mesh>
            </group>

        </group>
    );
}

const MachineModel3D: React.FC<MachineModel3DProps> = ({ status }) => {
    return (
        <div style={{
            width: '100%',
            height: '250px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'
        }}>
            <Canvas
                shadows
                camera={{ position: [4, 3, 5], fov: 40 }}
                style={{ width: '100%', height: '100%' }}
            >
                {/* High Quality Lighting Setup */}
                <ambientLight intensity={1.0} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={2}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <spotLight
                    position={[0, 5, 2]}
                    intensity={5}
                    angle={0.6}
                    penumbra={1}
                    color="#e0f2fe"
                    castShadow
                />
                <pointLight position={[-3, 2, -3]} intensity={1} color="#3b82f6" />

                {/* Environment Reflections (Simulated) */}
                <fog attach="fog" args={['#0f172a', 5, 20]} />

                <IndustrialMachine status={status} />

                <OrbitControls
                    enableZoom={true}
                    minDistance={3}
                    maxDistance={10}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={0.8}
                    maxPolarAngle={Math.PI / 2.1} // Prevent going below floor
                    minPolarAngle={0}
                />
            </Canvas>
        </div>
    );
};

export default MachineModel3D;
