import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface MachineModel3DProps {
    status: 'normal' | 'warning' | 'critical';
}

// Detailed CNC Machine Model
function IndustrialMachine({ status }: { status: 'normal' | 'warning' | 'critical' }) {
    const groupRef = useRef<THREE.Group>(null);

    // Subtle vibration animation for the internal spindle
    useFrame((state) => {
        if (groupRef.current) {
            // Gentle idle hover or vibration
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.005;
        }
    });

    return (
        <group ref={groupRef} position={[0, -0.5, 0]}>
            {/* --- ANAM GÖVDE (Main Chassis) - LIGHTER COLOR FOR VISIBILITY --- */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.2, 2.2, 2]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.4} />
            </mesh>

            {/* --- ÖN PANEL (Front Panel & Window) --- */}
            {/* Window Frame - Darker contrast */}
            <mesh position={[0, 0.2, 1.05]}>
                <boxGeometry args={[2, 1.2, 0.1]} />
                <meshStandardMaterial color="#334155" metalness={0.6} />
            </mesh>
            {/* Safety Glass (Transparent) - Lighter Tint */}
            <mesh position={[0, 0.2, 1.06]}>
                <planeGeometry args={[1.8, 1]} />
                <meshStandardMaterial
                    color="#bae6fd"
                    transparent
                    opacity={0.2}
                    metalness={0.9}
                    roughness={0}
                />
            </mesh>

            {/* --- İÇ MEKANİZMA (Internal Spindle & Chuck) --- */}
            <group position={[0, 0.2, 0.5]}>
                {/* Spindle Motor Housing */}
                <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                </mesh>
                {/* Chuck (Rotating Part) */}
                <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.25, 0.3, 0.4, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                </mesh>
                {/* Workpiece - Gold/Brass color to stand out */}
                <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
                    <meshStandardMaterial color="#fcd34d" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Tool Turret */}
                <mesh position={[0.5, -0.3, 0.3]}>
                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
            </group>

            {/* --- KONTROL PANELİ (HMI) --- */}
            <group position={[1.8, 0.5, 0.8]} rotation={[0, -0.5, 0]}>
                {/* Monitor Arm */}
                <mesh position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
                {/* Screen Body */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.1, 0.6, 0.8]} />
                    <meshStandardMaterial color="#0f172a" />
                </mesh>
                {/* Screen Display (Glowing) */}
                <mesh position={[-0.06, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[0.7, 0.5]} />
                    <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.8} />
                </mesh>
            </group>

            {/* --- DURUM KULESİ (Status Light Tower) --- */}
            <group position={[1.4, 1.1, -0.8]}>
                {/* Pole */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
                    <meshStandardMaterial color="#cbd5e1" />
                </mesh>
                {/* Red Light */}
                <mesh position={[0, 0.35, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
                    <meshStandardMaterial
                        color={status === 'critical' ? '#ef4444' : '#450a0a'}
                        emissive={status === 'critical' ? '#ef4444' : '#000'}
                        emissiveIntensity={status === 'critical' ? 2 : 0}
                    />
                </mesh>
                {/* Yellow Light */}
                <mesh position={[0, 0.2, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
                    <meshStandardMaterial
                        color={status === 'warning' ? '#fbbf24' : '#422006'}
                        emissive={status === 'warning' ? '#fbbf24' : '#000'}
                        emissiveIntensity={status === 'warning' ? 2 : 0}
                    />
                </mesh>
                {/* Green Light */}
                <mesh position={[0, 0.05, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
                    <meshStandardMaterial
                        color={status === 'normal' ? '#22c55e' : '#052e16'}
                        emissive={status === 'normal' ? '#22c55e' : '#000'}
                        emissiveIntensity={status === 'normal' ? 2 : 0}
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
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
        }}>
            <Canvas
                camera={{ position: [3, 2, 4], fov: 45 }}
                style={{ width: '100%', height: '100%' }}
            >
                {/* Improved Lighting for Visibility */}
                <ambientLight intensity={1.5} />
                <directionalLight position={[5, 10, 5]} intensity={2} color="#ffffff" castShadow />
                <pointLight position={[-5, 5, -5]} intensity={1} color="#3b82f6" />
                <spotLight position={[0, 5, 0]} angle={0.5} penumbra={1} intensity={1} color="#e0f2fe" />

                {/* Machine Model */}
                <IndustrialMachine status={status} />

                {/* Controls */}
                <OrbitControls
                    enableZoom={true}
                    minDistance={3}
                    maxDistance={8}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 4}
                />
            </Canvas>
        </div>
    );
};

export default MachineModel3D;
