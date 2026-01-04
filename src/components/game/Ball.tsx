import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONFIG } from '@/game/GameEngine';

interface BallProps {
  position: [number, number, number];
  isBouncing: boolean;
}

const Ball: React.FC<BallProps> = ({ position, isBouncing }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(1);
  
  // Ball geometry with slight squash/stretch
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(GAME_CONFIG.BALL_RADIUS, 32, 32);
  }, []);
  
  // Glossy red ball material
  const material = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: GAME_CONFIG.BALL_COLOR,
      shininess: 100,
      specular: 0xffffff,
      emissive: '#4a1515',
      emissiveIntensity: 0.1,
    });
  }, []);

  // Animate squash/stretch on bounce
  useFrame(() => {
    if (meshRef.current) {
      if (isBouncing) {
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1.2, 0.3);
        meshRef.current.scale.set(scaleRef.current, 0.8, scaleRef.current);
      } else {
        scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1, 0.1);
        meshRef.current.scale.set(1, scaleRef.current, 1);
      }
    }
  });

  return (
    <group position={position}>
      {/* Main ball */}
      <mesh ref={meshRef} geometry={geometry} material={material} />
      
      {/* Ball highlight/shine */}
      <mesh position={[0.05, 0.05, 0.08]}>
        <sphereGeometry args={[GAME_CONFIG.BALL_RADIUS * 0.25, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
      
      {/* Shadow under ball */}
      <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[GAME_CONFIG.BALL_RADIUS * 0.8, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

export default Ball;
