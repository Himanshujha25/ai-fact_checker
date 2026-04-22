import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Float, Environment, ContactShadows } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/scales/model.gltf');
  
  return (
    <primitive 
      object={scene} 
      scale={2.5} 
      position={[0, -0.8, 0]} 
      rotation={[0, Math.PI / 4, 0]}
    />
  );
}

const Statue3D = () => {
  return (
    <div className="w-full h-full relative cursor-grab">
      <Canvas shadows camera={{ position: [0, 1, 5], fov: 40 }}>
        {/* Transparent background so it blends with Home layout */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Suspense fallback={null}>
          <Environment preset="city" />
          <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <Model />
          </Float>
          <ContactShadows opacity={0.4} scale={10} blur={2} far={4.5} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} makeDefault />
      </Canvas>
    </div>
  );
};

export default Statue3D;
