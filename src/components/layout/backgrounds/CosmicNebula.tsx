
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CosmicNebula = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let stars: THREE.Points, nebula: THREE.Points;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let animationFrameId: number;

    const init = () => {
      try {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 1;

        renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, alpha: true, antialias: true });
      } catch (e) {
        console.error("Failed to initialize WebGL for CosmicNebula", e);
        return false;
      }
      
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Starfield
      const starGeometry = new THREE.BufferGeometry();
      const starVertices = [];
      for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starVertices.push(x, y, z);
      }
      starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
      const starMaterial = new THREE.PointsMaterial({ color: 0x888888, size: 0.7 });
      stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);

      // Nebula
      const nebulaGeometry = new THREE.BufferGeometry();
      const nebulaVertices = [];
      const textureLoader = new THREE.TextureLoader();
      const nebulaTexture = textureLoader.load('https://placehold.co/32x32.png'); // Placeholder, real would be a smoke/cloud texture

      for (let i = 0; i < 500; i++) {
        const x = Math.random() * 800 - 400;
        const y = Math.random() * 800 - 400;
        const z = Math.random() * 800 - 400;
        nebulaVertices.push(x, y, z);
      }
      nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
      
      const nebulaMaterial = new THREE.PointsMaterial({
        size: 50,
        map: nebulaTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: true
      });
      
      const colors: number[] = [];
      const color = new THREE.Color();
      for(let i = 0; i < nebulaGeometry.attributes.position.count; i++) {
        color.setHSL(Math.random(), 1.0, 0.5);
        colors.push(color.r, color.g, color.b);
      }
      nebulaGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
      scene.add(nebula);

      document.addEventListener('mousemove', onDocumentMouseMove, false);
      window.addEventListener('resize', onWindowResize, false);
      return true;
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.00005;
      
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      stars.rotation.x += 0.0001;
      stars.rotation.y += 0.0002;
      
      nebula.rotation.y = time * 0.5;

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

    if (init()) {
      animate();
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      renderer?.dispose();
      stars?.geometry.dispose();
      (stars?.material as THREE.Material)?.dispose();
      nebula?.geometry.dispose();
      (nebula?.material as THREE.Material)?.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default CosmicNebula;
