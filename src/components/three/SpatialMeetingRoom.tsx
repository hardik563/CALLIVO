import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useMeetingStore } from '../../stores/meetingStore';
import { useParticipantStore } from '../../stores/participantStore';
import { VideoPanel3D } from './VideoPanel3D';
import { Button } from '../ui/Button';
import { Volume2, VolumeX, RotateCcw, X, Sparkles } from 'lucide-react';

// Conference Room 3D Environment (Floor, Pillars, Lighting)
const RoomEnvironment: React.FC = () => {
  return (
    <group>
      {/* Dark Reflective Circular Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial
          color="#0B0D10"
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Grid Guide Overlay */}
      <Grid
        position={[0, -1.19, 0]}
        args={[28, 28]}
        cellSize={1.2}
        cellThickness={1}
        cellColor="#15191F"
        sectionSize={4}
        sectionThickness={1.5}
        sectionColor="#242A33"
        fadeDistance={22}
        fadeStrength={1.5}
      />

      {/* Subtle Ceiling Accent Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4.5, 0]}>
        <ringGeometry args={[4.8, 5.0, 64]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4.5, 0]}>
        <ringGeometry args={[2.8, 3.0, 64]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Perimeter Lighting Columns */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={i} position={[x, 1.5, -7]}>
          <boxGeometry args={[0.2, 5.5, 0.2]} />
          <meshBasicMaterial color="#15191F" />
        </mesh>
      ))}
    </group>
  );
};

// Animated Camera Focus Controller
const CameraController: React.FC<{
  selectedId: string | null;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}> = ({ selectedId, controlsRef }) => {
  useFrame((state) => {
    if (selectedId && controlsRef.current) {
      // Gentle smooth focus toward center
      state.camera.lookAt(0, 0.5, 0);
    }
  });
  return null;
};

export const SpatialMeetingRoom: React.FC = () => {
  const {
    setViewMode,
    isSpatialAudioEnabled,
    toggleSpatialAudio,
    selectedParticipantId,
    setSelectedParticipantId,
  } = useMeetingStore();

  const { participants } = useParticipantStore();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Position participants in a modern semicircular amphitheater arc
  const participantPositions = useMemo(() => {
    const total = participants.length;
    const radius = 5.2;
    const startAngle = -Math.PI * 0.75;
    const endAngle = -Math.PI * 0.25;
    const angleStep = total > 1 ? (endAngle - startAngle) / (total - 1) : 0;

    return participants.map((p, index) => {
      const angle = total === 1 ? -Math.PI * 0.5 : startAngle + index * angleStep;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius + 2.5;
      const y = 0.4;
      // Panel faces towards center (0, 0.4, 0)
      const rotY = Math.atan2(-x, -z);

      return {
        participant: p,
        position: [x, y, z] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
      };
    });
  }, [participants]);

  const handleResetCamera = () => {
    setSelectedParticipantId(null);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#080A0F] overflow-hidden select-none">
      {/* 3D Canvas Scene */}
      <Canvas
        camera={{ position: [0, 2.5, 6.8], fov: 50 }}
        gl={{ antialias: true }}
        className="w-full h-full"
      >
        <CameraController selectedId={selectedParticipantId} controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05} // prevent going below floor
          minDistance={3.5}
          maxDistance={12}
        />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[0, 8, 4]} intensity={1.2} />
        <pointLight position={[0, 4, 0]} intensity={2.0} color="#ffffff" distance={12} />
        <pointLight position={[-6, 2, 2]} intensity={1.4} color="#10B981" distance={8} />
        <pointLight position={[6, 2, 2]} intensity={1.4} color="#34D399" distance={8} />

        {/* Virtual 3D Environment */}
        <RoomEnvironment />

        {/* Floating Participant Panels */}
        {participantPositions.map(({ participant, position, rotation }) => (
          <VideoPanel3D
            key={participant.id}
            participant={participant}
            position={position}
            rotation={rotation}
            isSelected={selectedParticipantId === participant.id}
            onSelect={(id) => setSelectedParticipantId(selectedParticipantId === id ? null : id)}
          />
        ))}
      </Canvas>

      {/* Top Floating Spatial HUD */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3 bg-surface-elevated/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-lg pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> CALLIVO Spatial Meeting
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag to rotate • Scroll to zoom • Click panel to focus
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleSpatialAudio}
            leftIcon={isSpatialAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-brand-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            className="backdrop-blur-md bg-surface-elevated/85 border-slate-700/80"
          >
            Spatial Audio: {isSpatialAudioEnabled ? 'ON' : 'OFF'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetCamera}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="backdrop-blur-md bg-surface-elevated/85 border-slate-700/80"
          >
            Reset View
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setViewMode('grid')}
            leftIcon={<X className="w-3.5 h-3.5" />}
          >
            Exit Spatial
          </Button>
        </div>
      </div>
    </div>
  );
};
