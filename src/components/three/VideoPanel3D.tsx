import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Participant } from '../../types';

interface VideoPanel3DProps {
  participant: Participant;
  position: [number, number, number];
  rotation?: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const VideoPanel3D: React.FC<VideoPanel3DProps> = ({
  participant,
  position,
  rotation = [0, 0, 0],
  isSelected,
  onSelect,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Animate speaking pulse
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle float
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.05;
    }

    if (glowRef.current) {
      if (participant.isSpeaking) {
        const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 6) * 0.06;
        glowRef.current.scale.set(pulse, pulse, 1);
      } else {
        glowRef.current.scale.set(1, 1, 1);
      }
    }
  });

  const width = 2.4;
  const height = 1.45;

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(participant.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Speaking / Selected Glow Ring */}
      <mesh ref={glowRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[width + 0.12, height + 0.12]} />
        <meshBasicMaterial
          color={
            isSelected
              ? '#10B981'
              : participant.isSpeaking
              ? '#10B981'
              : '#34D399'
          }
          transparent
          opacity={isSelected ? 0.7 : participant.isSpeaking ? 0.8 : 0.15}
        />
      </mesh>

      {/* Main Video Tile Body */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#15191F"
          roughness={0.25}
          metalness={0.8}
          clearcoat={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner Screen Surface */}
      <mesh position={[0, 0.05, 0.01]}>
        <planeGeometry args={[width - 0.15, height - 0.25]} />
        <meshBasicMaterial color="#0B0D10" />
      </mesh>

      {/* Avatar circular badge in 3D */}
      <mesh position={[0, 0.1, 0.02]}>
        <circleGeometry args={[0.26, 32]} />
        <meshBasicMaterial color={participant.isSpeaking ? '#059669' : '#15191F'} />
      </mesh>

      {/* Initials Text */}
      <Text
        position={[0, 0.1, 0.03]}
        fontSize={0.16}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {participant.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
      </Text>

      {/* Status Bar background */}
      <mesh position={[0, -height / 2 + 0.15, 0.02]}>
        <planeGeometry args={[width - 0.2, 0.22]} />
        <meshBasicMaterial color="#0B0D10" transparent opacity={0.85} />
      </mesh>

      {/* Participant Name Tag */}
      <Text
        position={[-width / 2 + 0.2, -height / 2 + 0.15, 0.03]}
        fontSize={0.09}
        color="#F8FAFC"
        anchorX="left"
        anchorY="middle"
        maxWidth={width * 0.65}
      >
        {participant.name}
      </Text>

      {/* Mic indicator dot */}
      <mesh position={[width / 2 - 0.25, -height / 2 + 0.15, 0.03]}>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color={participant.isMuted ? '#EF4444' : '#10B981'} />
      </mesh>

      {/* Raised Hand Badge */}
      {participant.isHandRaised && (
        <Text
          position={[width / 2 - 0.45, -height / 2 + 0.15, 0.03]}
          fontSize={0.09}
          color="#F59E0B"
          anchorX="center"
          anchorY="middle"
        >
          ✋
        </Text>
      )}
    </group>
  );
};
