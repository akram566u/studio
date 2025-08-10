
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SynthwaveSunset = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let grid: THREE.LineSegments, sun: THREE.Mesh;
    let animationFrameId: number;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 5, 20);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Grid
      const size = 500;
      const divisions = 40;
      const gridHelper = new THREE.GridHelper(size, divisions, 0xff00ff, 0x00ffff);
      gridHelper.position.y = -10;
      scene.add(gridHelper);

      // Sun
      const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
      const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.BackSide });
      sun = new THREE.Mesh(sunGeometry, sunMaterial);
      sun.position.set(0, 5, -50);
      scene.add(sun);
      
      // Post-processing-like effect with background gradient
      scene.fog = new THREE.Fog(0x000000, 1, 200);
      scene.background = new THREE.Color(0x0a001a);
      
      window.addEventListener('resize', onWindowResize, false);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.0002;
      
      camera.position.z -= 0.05;
      if (camera.position.z < -20) {
        camera.position.z = 20;
      }
      sun.position.y = 5 + Math.sin(time * 2) * 2;
      
      renderer.render(scene, camera);
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    init();
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      renderer.dispose();
      (grid?.geometry as any)?.dispose();
      (grid?.material as any)?.dispose();
      sun?.geometry.dispose();
      (sun?.material as any)?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default SynthwaveSunset;
