import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Platform, GAME_CONFIG } from '@/game/GameEngine';

interface HelixTowerProps {
  platforms: Platform[];
  rotation: number;
}

const HelixTower: React.FC<HelixTowerProps> = ({ platforms, rotation }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create the central tower cylinder
  const towerGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(
      GAME_CONFIG.TOWER_RADIUS * 0.3,
      GAME_CONFIG.TOWER_RADIUS * 0.3,
      GAME_CONFIG.TOWER_HEIGHT,
      32
    );
  }, []);

  const towerMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: '#2a3a4a',
      shininess: 80,
    });
  }, []);

  return (
    <group ref={groupRef} rotation-y={rotation}>
      {/* Central Tower Pole */}
      <mesh 
        geometry={towerGeometry} 
        material={towerMaterial}
        position={[0, -GAME_CONFIG.TOWER_HEIGHT / 2 + 5, 0]}
      />
      
      {/* Platform Rings */}
      {platforms.map((platform) => (
        <PlatformRing key={platform.id} platform={platform} />
      ))}
    </group>
  );
};

interface PlatformRingProps {
  platform: Platform;
}

const PlatformRing: React.FC<PlatformRingProps> = ({ platform }) => {
  return (
    <group position={[0, platform.y, 0]}>
      {platform.segments.map((segment, index) => (
        <PlatformSegment
          key={index}
          startAngle={segment.startAngle}
          endAngle={segment.endAngle}
          isDanger={segment.isDanger}
          color={segment.color}
        />
      ))}
    </group>
  );
};

interface PlatformSegmentProps {
  startAngle: number;
  endAngle: number;
  isDanger: boolean;
  color: string;
}

const PlatformSegment: React.FC<PlatformSegmentProps> = ({
  startAngle,
  endAngle,
  isDanger,
  color,
}) => {
  const geometry = useMemo(() => {
    const innerRadius = GAME_CONFIG.TOWER_RADIUS * 0.35;
    const outerRadius = GAME_CONFIG.TOWER_RADIUS;
    const height = GAME_CONFIG.PLATFORM_HEIGHT;
    
    const shape = new THREE.Shape();
    const segments = 12;
    
    // Create arc shape
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      const x = Math.cos(angle) * outerRadius;
      const z = Math.sin(angle) * outerRadius;
      if (i === 0) {
        shape.moveTo(x, z);
      } else {
        shape.lineTo(x, z);
      }
    }
    
    // Inner arc (reverse)
    for (let i = segments; i >= 0; i--) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * innerRadius;
      shape.lineTo(x, z);
    }
    
    shape.closePath();
    
    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    };
    
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -height / 2, 0);
    
    return geo;
  }, [startAngle, endAngle]);

  const material = useMemo(() => {
    if (isDanger) {
      // Create checkered pattern for danger segments
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      
      const checkSize = 8;
      for (let x = 0; x < 64; x += checkSize) {
        for (let y = 0; y < 64; y += checkSize) {
          ctx.fillStyle = ((x + y) / checkSize) % 2 === 0 ? '#1a1a1a' : '#f5f5f5';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 1);
      
      return new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 30,
      });
    }
    
    return new THREE.MeshPhongMaterial({
      color: color,
      shininess: 60,
      specular: 0x444444,
    });
  }, [isDanger, color]);

  return <mesh geometry={geometry} material={material} />;
};

export default HelixTower;
