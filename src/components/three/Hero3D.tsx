import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, RoundedBox, Image } from '@react-three/drei';
import * as THREE from 'three';

// 3D Participant Satellite Node Framing the Hero
const HeroParticipantNode: React.FC<{
  position: [number, number, number];
  name: string;
  role: string;
  avatarUrl: string;
  accentColor?: string;
  isSpeaking?: boolean;
  badge?: string;
}> = ({
  position,
  name,
  role,
  avatarUrl,
  accentColor = '#10B981',
  isSpeaking = false,
  badge,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0] * 2) * 0.08;
      groupRef.current.position.x = position[0] + Math.cos(t * 0.8 + position[1]) * 0.04;
    }
    if (glowRef.current && isSpeaking) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      glowRef.current.scale.set(pulse, pulse, 1);
    }
  });

  const cardW = 1.9;
  const cardH = 1.25;

  return (
    <group ref={groupRef} position={position}>
      {/* Speaking Outer Glow */}
      {isSpeaking && (
        <mesh ref={glowRef} position={[0, 0, -0.04]}>
          <planeGeometry args={[cardW + 0.25, cardH + 0.25]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main Glassmorphic Panel */}
      <RoundedBox args={[cardW, cardH, 0.06]} radius={0.09} smoothness={4}>
        <meshPhysicalMaterial
          color="#10141A"
          roughness={0.2}
          metalness={0.8}
          clearcoat={0.6}
          transparent
          opacity={0.92}
        />
      </RoundedBox>

      {/* Glowing Neon Border Ring */}
      <lineSegments position={[0, 0, 0.035]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(cardW - 0.02, cardH - 0.02)]} />
        <lineBasicMaterial color={accentColor} transparent opacity={0.7} />
      </lineSegments>

      {/* Attendee AI Portrait Headshot */}
      <React.Suspense
        fallback={
          <mesh position={[-0.45, 0.12, 0.04]}>
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        }
      >
        <Image
          url={avatarUrl}
          position={[-0.45, 0.12, 0.045]}
          scale={[0.62, 0.62]}
          radius={0.31}
          transparent
        />
      </React.Suspense>

      {/* Portrait Ring Accent */}
      <mesh position={[-0.45, 0.12, 0.05]}>
        <ringGeometry args={[0.31, 0.33, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.85} />
      </mesh>

      {/* Badge Pill (Top Right) */}
      {badge && (
        <group position={[0.42, 0.38, 0.04]}>
          <mesh>
            <planeGeometry args={[0.7, 0.18]} />
            <meshBasicMaterial color="#0B0D10" transparent opacity={0.9} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.07} color={accentColor} anchorX="center" anchorY="middle">
            {badge}
          </Text>
        </group>
      )}

      {/* Live Audio Equalizer Bars */}
      <group position={[0.35, 0.12, 0.04]}>
        {[-0.18, -0.09, 0, 0.09, 0.18].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[0.022, 0.12 + Math.sin(i * 1.8) * 0.08, 0.01]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        ))}
      </group>

      {/* Name Text */}
      <Text
        position={[0, -0.26, 0.04]}
        fontSize={0.105}
        color="#F8FAFC"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Role / Status Text */}
      <Text
        position={[0, -0.42, 0.04]}
        fontSize={0.075}
        color={isSpeaking ? '#34D399' : '#94A3B8'}
        anchorX="center"
        anchorY="middle"
      >
        {role}
      </Text>
    </group>
  );
};

// Gyroscopic Concentric Orbit Rings
const GyroscopicSpatialRings: React.FC = () => {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.25;
      ring1.current.rotation.y = t * 0.35;
    }
    if (ring2.current) {
      ring2.current.rotation.y = -t * 0.3;
      ring2.current.rotation.z = t * 0.2;
    }
    if (ring3.current) {
      ring3.current.rotation.x = -t * 0.18;
      ring3.current.rotation.z = -t * 0.22;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.4;
      const s = 1 + Math.sin(t * 2) * 0.06;
      coreRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[0, 0.2, -2.4]}>
      {/* Outer Gyro Ring */}
      <mesh ref={ring1}>
        <torusGeometry args={[3.8, 0.022, 16, 90]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.35} />
      </mesh>

      {/* Mid Gyro Ring */}
      <mesh ref={ring2}>
        <torusGeometry args={[3.0, 0.018, 16, 80]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.4} />
      </mesh>

      {/* Inner Gyro Ring */}
      <mesh ref={ring3}>
        <torusGeometry args={[2.2, 0.015, 16, 70]} />
        <meshBasicMaterial color="#6EE7B7" transparent opacity={0.45} />
      </mesh>

      {/* Central Pulsing Spatial Audio Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshBasicMaterial color="#10B981" wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// Radial Audio Frequency Waveform Visualizer
const AudioWaveformVisualizer: React.FC<{ count?: number }> = ({ count = 36 }) => {
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!barsRef.current) return;
    const t = state.clock.getElapsedTime();
    const radius = 3.6;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * (radius * 0.55);
      const wave = Math.sin(t * 3.5 + i * 0.35) * 0.5 + 0.5;
      const scaleY = 0.06 + wave * 0.22;

      dummy.position.set(x, y - 0.2, -1.8);
      dummy.rotation.z = angle + Math.PI / 2;
      dummy.scale.set(1, scaleY * 4, 1);
      dummy.updateMatrix();
      barsRef.current.setMatrixAt(i, dummy.matrix);
    }
    barsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={barsRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.02, 0.1, 0.02]} />
      <meshBasicMaterial color="#10B981" transparent opacity={0.4} />
    </instancedMesh>
  );
};

// Atmospheric Stardust Particles
const AmbientStardust: React.FC<{ count?: number }> = ({ count = 90 }) => {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 16;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 10;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return coords;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#34D399"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Mouse Parallax Camera Rig
const CameraRig: React.FC = () => {
  const { camera, pointer } = useThree();

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.7, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.35, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
};

export const Hero3D: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 46 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <CameraRig />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 7, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-4, 3, -1]} intensity={2.5} color="#10B981" distance={12} />
        <pointLight position={[4, -2, -1]} intensity={2.2} color="#34D399" distance={12} />
        <pointLight position={[0, 0, 2]} intensity={1.2} color="#059669" distance={8} />

        {/* Dynamic Gyroscopic Spatial Rings & Sound Core */}
        <GyroscopicSpatialRings />

        {/* Audio Frequency Equalizer Ring */}
        <AudioWaveformVisualizer count={38} />

        {/* Orbiting Participant Hologram Nodes Framing the Headline */}
        {/* Top-Left: Elena Rostova (VP Engineering) */}
        <Float speed={1.8} rotationIntensity={0.15} floatIntensity={0.35}>
          <HeroParticipantNode
            position={[-3.1, 1.25, 0.2]}
            name="Elena Rostova"
            role="VP Eng • 48kHz Opus"
            avatarUrl="/avatars/elena.jpg"
            accentColor="#10B981"
            isSpeaking={true}
            badge="● LIVE"
          />
        </Float>

        {/* Top-Right: Hardik Dhamija (Host & Founder) */}
        <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
          <HeroParticipantNode
            position={[3.1, 1.25, 0.2]}
            name="Hardik Dhamija"
            role="Session Host • Ultra HD"
            avatarUrl="/avatars/hardik.jpg"
            accentColor="#10B981"
            isSpeaking={true}
            badge="HOST"
          />
        </Float>

        {/* Bottom-Left: Sarah Lin (Head of Product) */}
        <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.35}>
          <HeroParticipantNode
            position={[-3.3, -1.05, -0.3]}
            name="Sarah Lin"
            role="Head of Product • 1080p"
            avatarUrl="/avatars/sarah.jpg"
            accentColor="#34D399"
            badge="60 FPS"
          />
        </Float>

        {/* Bottom-Right: Marcus Vance (Lead Architect) */}
        <Float speed={1.7} rotationIntensity={0.18} floatIntensity={0.35}>
          <HeroParticipantNode
            position={[3.3, -1.05, -0.3]}
            name="Marcus Vance"
            role="Product Lead • Spatial"
            avatarUrl="/avatars/marcus.jpg"
            accentColor="#34D399"
            badge="STEREO"
          />
        </Float>

        {/* Ambient Stardust Galaxy Particles */}
        <AmbientStardust count={95} />
      </Canvas>

      {/* Bottom gradient mask for soft blend into landing content */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10]/80 to-transparent pointer-events-none" />
    </div>
  );
};
