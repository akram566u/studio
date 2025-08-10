
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const FloatingCrystals = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let objects: THREE.Mesh[] = [];
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let animationFrameId: number;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, alpha: true, antialias: true });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0x88EEFF, 1.5);
      directionalLight1.position.set(100, 100, 100);
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xFF88CC, 1.2);
      directionalLight2.position.set(-100, -50, -100);
      scene.add(directionalLight2);
      
      const directionalLight3 = new THREE.DirectionalLight(0xFFFF88, 1.0);
      directionalLight3.position.set(0, 150, 50);
      scene.add(directionalLight3);

      const crystalMaterialSettings = {
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.3,
        depthWrite: false
      };

      const crystalMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x8A2BE2, emissive: 0x4B0082, ...crystalMaterialSettings }),
        new THREE.MeshStandardMaterial({ color: 0x00CED1, emissive: 0x008B8B, ...crystalMaterialSettings }),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xB8860B, ...crystalMaterialSettings }),
        new THREE.MeshStandardMaterial({ color: 0x32CD32, emissive: 0x228B22, ...crystalMaterialSettings }),
        new THREE.MeshStandardMaterial({ color: 0xFF69B4, emissive: 0xC71585, ...crystalMaterialSettings }),
        new THREE.MeshStandardMaterial({ color: 0x1E90FF, emissive: 0x0000CD, ...crystalMaterialSettings }),
      ];

      const crystalGeometries = [
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.DodecahedronGeometry(1.0),
        new THREE.OctahedronGeometry(1.1),
        new THREE.IcosahedronGeometry(1.2),
        new THREE.ConeGeometry(0.8, 1.8, 32),
        new THREE.CylinderGeometry(0.6, 0.6, 1.8, 32),
        new THREE.TorusKnotGeometry(0.7, 0.2, 64, 8)
      ];

      for (let i = 0; i < 150; i++) {
        const geometry = crystalGeometries[Math.floor(Math.random() * crystalGeometries.length)];
        const material = crystalMaterials[Math.floor(Math.random() * crystalMaterials.length)];
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = Math.random() * 200 - 100;
        mesh.position.y = Math.random() * 200 - 100;
        mesh.position.z = Math.random() * 200 - 100;

        mesh.rotation.x = Math.random() * Math.PI;
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = Math.random() * Math.PI;

        const scale = Math.random() * 0.6 + 0.4;
        mesh.scale.set(scale, scale, scale);

        scene.add(mesh);
        objects.push(mesh);
      }

      camera.position.z = 5;

      document.addEventListener('mousemove', onDocumentMouseMove, false);
      window.addEventListener('resize', onWindowResize, false);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      objects.forEach(obj => {
        obj.rotation.x += 0.001 + (Math.sin(Date.now() * 0.0001 + obj.uuid.charCodeAt(0)) * 0.0005);
        obj.rotation.y += 0.001 + (Math.cos(Date.now() * 0.0001 + obj.uuid.charCodeAt(1)) * 0.0005);
        obj.position.y += Math.sin(Date.now() * 0.0003 + obj.uuid.charCodeAt(2)) * 0.005;
      });

      camera.position.x += (mouseX / 800 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY / 800 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    const onWindowResize = () => {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX - windowHalfX;
      mouseY = event.clientY - windowHalfY;
    };

    init();
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      renderer.dispose();
      objects.forEach(obj => {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
        } else {
            obj.material.dispose();
        }
      });
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default FloatingCrystals;
