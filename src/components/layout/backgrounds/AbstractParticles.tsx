
"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AbstractParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    let particles: THREE.Points;
    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;
    let animationFrameId: number;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 300;

      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const particleCount = 5000;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const sizes = new Float32Array(particleCount);

      const color = new THREE.Color();

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() * 2 - 1) * 500;
        positions[i3 + 1] = (Math.random() * 2 - 1) * 500;
        positions[i3 + 2] = (Math.random() * 2 - 1) * 500;
        
        color.setHSL(i / particleCount, 1.0, 0.5);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = Math.random() * 5 + 1;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      
      const material = new THREE.PointsMaterial({
        size: 15,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      particles = new THREE.Points(geometry, material);
      scene.add(particles);

      document.addEventListener('mousemove', onDocumentMouseMove, false);
      window.addEventListener('resize', onWindowResize, false);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      
      particles.rotation.x = time * 0.1;
      particles.rotation.y = time * 0.05;

      camera.position.x += (mouseX / 2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY / 2 - camera.position.y) * 0.02;
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
      particles.geometry.dispose();
      (particles.material as THREE.Material).dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default AbstractParticles;
