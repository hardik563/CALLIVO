import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, RoundedBox, Image } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Sparkles, RotateCcw, Volume2, VolumeX, Video } from 'lucide-react';
import { generateMeetingId } from '../../lib/utils';
import { useMeetingStore } from '../../stores/meetingStore';

// Individual 3D Attendee Card in the Spatial Conference Room
const SpatialAttendeeCard: React.FC<{
  name: string;
  role: string;
  initials: string;
  avatarUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isSpeaking?: boolean;
  handRaised?: boolean;
  statusText?: string;
  gradientColor: string;
}> = ({
  name,
  role,
  initials,
  avatarUrl,
  position,
  rotation,
  isSpeaking = false,
  handRaised = false,
  statusText,
  gradientColor,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Subtle floating idle motion and speaking pulse animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.04;
    }
    if (ringRef.current && isSpeaking) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 6) * 0.06;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group ref={meshRef} position={position} rotation={rotation}>
      {/* Outer Glow Halo when Speaking */}
      {isSpeaking && (
        <mesh ref={ringRef} position={[0, 0, -0.05]}>
          <planeGeometry args={[2.3, 1.6]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Main Glassmorphic Panel Frame */}
      <RoundedBox args={[2.1, 1.45, 0.08]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color="#15191F"
          roughness={0.25}
          metalness={0.8}
        />
      </RoundedBox>

      {/* Front Face Display Surface */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[1.98, 1.33]} />
        <meshBasicMaterial color="#0B0D10" />
      </mesh>

      {/* Real AI Portrait Headshot */}
      <React.Suspense
        fallback={
          <mesh position={[0, 0.16, 0.06]}>
            <circleGeometry args={[0.36, 32]} />
            <meshBasicMaterial color={gradientColor} />
          </mesh>
        }
      >
        <Image
          url={avatarUrl}
          position={[0, 0.16, 0.06]}
          scale={[0.76, 0.76]}
          radius={0.38}
          transparent
        />
      </React.Suspense>

      {/* Portrait Ring Accent */}
      <mesh position={[0, 0.16, 0.065]}>
        <ringGeometry args={[0.38, 0.405, 36]} />
        <meshBasicMaterial
          color={isSpeaking ? '#10B981' : '#334155'}
          transparent
          opacity={isSpeaking ? 0.9 : 0.6}
        />
      </mesh>

      {/* Active Speaker Audio Frequency Equalizer */}
      {isSpeaking && (
        <group position={[0, -0.08, 0.065]}>
          {[-0.18, -0.09, 0, 0.09, 0.18].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.025, 0.06 + ((i % 2 === 0) ? 0.04 : 0.01), 0.01]} />
              <meshBasicMaterial color="#10B981" />
            </mesh>
          ))}
        </group>
      )}

      {/* Name Text */}
      <Text
        position={[0, -0.22, 0.07]}
        fontSize={0.11}
        color="#F1F5F9"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Role / Telemetry Pill */}
      <Text
        position={[0, -0.4, 0.07]}
        fontSize={0.08}
        color={isSpeaking ? '#34D399' : '#94A3B8'}
        anchorX="center"
        anchorY="middle"
      >
        {isSpeaking ? '● Speaking (Opus HD)' : statusText || role}
      </Text>

      {/* Raised Hand Badge */}
      {handRaised && (
        <group position={[0.75, 0.45, 0.08]}>
          <mesh>
            <circleGeometry args={[0.15, 24]} />
            <meshBasicMaterial color="#F59E0B" />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.13} anchorX="center" anchorY="middle">
            ✋
          </Text>
        </group>
      )}
    </group>
  );
};

// Conference Room 3D Architecture: Reflective Floor & Ambient Guidelines
const ConferenceRoomEnvironment: React.FC = () => {
  return (
    <group>
      {/* Dark Circular Polished Conference Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial
          color="#0B0D10"
          roughness={0.15}
          metalness={0.8}
        />
      </mesh>

      {/* Architectural Grid Line Guides */}
      <Grid
        position={[0, -1.19, 0]}
        args={[24, 24]}
        cellSize={1.2}
        cellThickness={1}
        cellColor="#15191F"
        sectionSize={3.6}
        sectionThickness={1.5}
        sectionColor="#242A33"
        fadeDistance={18}
        fadeStrength={1.4}
      />

      {/* Center Holographic Presentation Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
        <ringGeometry args={[1.8, 1.88, 64]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Ambient Radial Ring Accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
        <ringGeometry args={[4.8, 4.88, 64]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const LandingSpatialRoom: React.FC = () => {
  const navigate = useNavigate();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { setActiveMeeting, setViewMode } = useMeetingStore();
  const [spatialAudio, setSpatialAudio] = useState(true);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleLaunchSpatialMeeting = () => {
    const id = generateMeetingId();
    setActiveMeeting({
      id,
      title: 'Spatial Conference Session',
      isHost: true,
    });
    setViewMode('spatial');
    navigate(`/meetings/${id}/lobby`);
  };

  // Attendees arranged in a natural amphitheater arc
  const attendees = [
    {
      name: 'Hardik Dhamija',
      role: 'Session Host',
      initials: 'HD',
      avatarUrl: '/avatars/hardik.jpg',
      position: [0, 0.4, -3.8] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      isSpeaking: true,
      gradientColor: '#059669',
    },
    {
      name: 'Elena Rostova',
      role: 'VP Engineering',
      initials: 'ER',
      avatarUrl: '/avatars/elena.jpg',
      position: [-2.9, 0.4, -2.8] as [number, number, number],
      rotation: [0, 0.45, 0] as [number, number, number],
      handRaised: true,
      statusText: '✋ Hand Raised',
      gradientColor: '#4F46E5',
    },
    {
      name: 'Marcus Vance',
      role: 'Product Lead',
      initials: 'MV',
      avatarUrl: '/avatars/marcus.jpg',
      position: [2.9, 0.4, -2.8] as [number, number, number],
      rotation: [0, -0.45, 0] as [number, number, number],
      statusText: '48kHz Opus Audio',
      gradientColor: '#7C3AED',
    },
    {
      name: 'Sarah Lin',
      role: 'Head of Product',
      initials: 'SL',
      avatarUrl: '/avatars/sarah.jpg',
      position: [-4.8, 0.4, -1.2] as [number, number, number],
      rotation: [0, 0.85, 0] as [number, number, number],
      statusText: '1080p 60 FPS',
      gradientColor: '#DB2777',
    },
    {
      name: 'Alex Mercer',
      role: 'Staff Architect',
      initials: 'AM',
      avatarUrl: '/avatars/alex.jpg',
      position: [4.8, 0.4, -1.2] as [number, number, number],
      rotation: [0, -0.85, 0] as [number, number, number],
      statusText: 'Ultra-Low Jitter',
      gradientColor: '#D97706',
    },
  ];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-[#242A33] bg-[#0B0D10] shadow-2xl">
      {/* 3D WebGL Canvas Stage */}
      <div className="h-[520px] sm:h-[600px] w-full relative">
        <Canvas
          camera={{ position: [0, 3.2, 5.8], fov: 48 }}
          gl={{ antialias: true }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2 - 0.08}
            minDistance={3.2}
            maxDistance={11}
          />

          {/* Studio Ambient & Directional Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[0, 8, 4]} intensity={1.4} color="#ffffff" />
          <pointLight position={[0, 3, 0]} intensity={2.2} color="#10B981" distance={10} />
          <pointLight position={[-5, 2, -2]} intensity={1.5} color="#34D399" distance={8} />
          <pointLight position={[5, 2, -2]} intensity={1.5} color="#059669" distance={8} />

          {/* Virtual Architecture Floor */}
          <ConferenceRoomEnvironment />

          {/* Semicircular Attendee Cards */}
          {attendees.map((attendee) => (
            <SpatialAttendeeCard
              key={attendee.name}
              name={attendee.name}
              role={attendee.role}
              initials={attendee.initials}
              avatarUrl={attendee.avatarUrl}
              position={attendee.position}
              rotation={attendee.rotation}
              isSpeaking={attendee.isSpeaking}
              handRaised={attendee.handRaised}
              statusText={attendee.statusText}
              gradientColor={attendee.gradientColor}
            />
          ))}
        </Canvas>

        {/* Floating Top HUD */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#15191F]/90 backdrop-blur-md border border-[#242A33] text-xs font-semibold text-slate-200 pointer-events-auto shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-emerald-400">Interactive 3D Stage</span>
            <span className="text-[#242A33]">•</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">Drag to Orbit • Scroll to Zoom</span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setSpatialAudio(!spatialAudio)}
              className="p-2 rounded-xl bg-[#15191F]/90 hover:bg-[#242A33] border border-[#242A33] text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 shadow-md"
              title="Toggle Directional Audio Simulation"
            >
              {spatialAudio ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">Spatial Audio: {spatialAudio ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleResetCamera}
              className="p-2 rounded-xl bg-[#15191F]/90 hover:bg-[#242A33] border border-[#242A33] text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 shadow-md"
              title="Reset 3D Camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Camera</span>
            </button>
          </div>
        </div>

        {/* Floating Bottom Action Bar */}
        <div className="absolute bottom-4 inset-x-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-[#0B0D10]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#242A33] pointer-events-auto">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebGL 60 FPS Directional Soundstage</span>
          </div>

          <div className="pointer-events-auto">
            <Button
              variant="glow"
              size="sm"
              onClick={handleLaunchSpatialMeeting}
              leftIcon={<Video className="w-3.5 h-3.5" />}
              className="shadow-glow text-xs"
            >
              Enter Spatial Conference
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
