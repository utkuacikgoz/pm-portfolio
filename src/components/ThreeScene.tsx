import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeSceneProps {
  section: number;
  color: string;
  label: string;
}

export default function ThreeScene({ section, color }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const geometriesRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(color, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const edgeLight = new THREE.PointLight(color, 1);
    edgeLight.position.set(-5, -5, 5);
    scene.add(edgeLight);

    // Create Bauhaus-inspired geometry based on section
    const createGeometry = () => {
      // Clear previous geometries
      geometriesRef.current.forEach(mesh => scene.remove(mesh));
      geometriesRef.current = [];

      const colorObj = new THREE.Color(color);

      switch (section) {
        case 0: // PROBLEM - Chaos (fragments)
          {
            for (let i = 0; i < 5; i++) {
              const geometry = new THREE.BoxGeometry(
                Math.random() * 0.6 + 0.3,
                Math.random() * 0.6 + 0.3,
                Math.random() * 0.6 + 0.3
              );
              const material = new THREE.MeshStandardMaterial({
                color: colorObj,
                metalness: 0.6,
                roughness: 0.4,
                wireframe: false
              });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 2
              );
              mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
              );
              scene.add(mesh);
              geometriesRef.current.push(mesh);
            }
          }
          break;

        case 1: // CONSTRAINTS - Pyramid (structure)
          {
            const geometry = new THREE.ConeGeometry(1.5, 3, 4);
            const material = new THREE.MeshStandardMaterial({
              color: colorObj,
              metalness: 0.7,
              roughness: 0.3
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = 0;
            scene.add(mesh);
            geometriesRef.current.push(mesh);

            // Add constraint lines
            for (let i = 0; i < 4; i++) {
              const angle = (i / 4) * Math.PI * 2;
              const geometry = new THREE.BoxGeometry(0.1, 2, 0.1);
              const material = new THREE.MeshStandardMaterial({
                color: colorObj,
                emissive: colorObj,
                emissiveIntensity: 0.3
              });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(
                Math.cos(angle) * 1.5,
                -0.5,
                Math.sin(angle) * 1.5
              );
              scene.add(mesh);
              geometriesRef.current.push(mesh);
            }
          }
          break;

        case 2: // APPROACH - Sphere with grid
          {
            const geometry = new THREE.IcosahedronGeometry(1.5, 4);
            const material = new THREE.MeshStandardMaterial({
              color: colorObj,
              metalness: 0.8,
              roughness: 0.2,
              wireframe: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
            geometriesRef.current.push(mesh);

            // Add internal cube
            const cubeGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
            const cubeMat = new THREE.MeshStandardMaterial({
              color: colorObj,
              metalness: 0.5,
              roughness: 0.5,
              wireframe: false
            });
            const cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
            scene.add(cubeMesh);
            geometriesRef.current.push(cubeMesh);
          }
          break;

        case 3: // RESULTS - Ascending towers (growth)
          {
            for (let i = 0; i < 3; i++) {
              const height = 1 + i * 0.8;
              const geometry = new THREE.BoxGeometry(0.6, height, 0.6);
              const material = new THREE.MeshStandardMaterial({
                color: colorObj,
                metalness: 0.6,
                roughness: 0.4
              });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.set((i - 1) * 1.5, -height / 2 + 0.5, 0);
              scene.add(mesh);
              geometriesRef.current.push(mesh);
            }
          }
          break;

        case 4: // LEARNINGS - Connected nodes (knowledge)
          {
            const positions = [
              { x: 0, y: 0, z: 0 },
              { x: 2, y: 0, z: 0 },
              { x: -2, y: 0, z: 0 },
              { x: 0, y: 2, z: 0 },
              { x: 0, y: -2, z: 0 }
            ];

            // Create nodes
            positions.forEach(pos => {
              const geometry = new THREE.SphereGeometry(0.3, 32, 32);
              const material = new THREE.MeshStandardMaterial({
                color: colorObj,
                metalness: 0.8,
                roughness: 0.2,
                emissive: colorObj,
                emissiveIntensity: 0.2
              });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.copy(pos as any);
              scene.add(mesh);
              geometriesRef.current.push(mesh);
            });

            // Connect with lines
            positions.slice(1).forEach((pos) => {
              const geometry = new THREE.BufferGeometry();
              const vertices = new Float32Array([
                0, 0, 0,
                pos.x, pos.y, pos.z
              ]);
              geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
              const material = new THREE.LineBasicMaterial({
                color: colorObj,
                linewidth: 2
              });
              const line = new THREE.Line(geometry, material);
              scene.add(line);
            });
          }
          break;
      }
    };

    createGeometry();

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      geometriesRef.current.forEach((mesh, index) => {
        // Different rotation based on section
        switch (section) {
          case 0: // Chaotic rotation
            mesh.rotation.x += 0.01 + Math.sin(time + index) * 0.005;
            mesh.rotation.y += 0.015 + Math.cos(time + index) * 0.005;
            mesh.position.y += Math.sin(time + index) * 0.001;
            break;
          case 1: // Steady rotation
            mesh.rotation.z += 0.002;
            break;
          case 2: // Orbiting
            if (index === 0) {
              mesh.rotation.x += 0.003;
              mesh.rotation.y += 0.005;
            } else {
              mesh.rotation.x -= 0.005;
              mesh.rotation.y -= 0.003;
            }
            break;
          case 3: // Pulsing
            mesh.scale.y = 1 + Math.sin(time * 2 + index) * 0.1;
            break;
          case 4: // Gentle orbit
            const angle = (time + index * 1.2) * 0.5;
            if (index > 0) {
              mesh.position.x = Math.cos(angle) * 2;
              mesh.position.y = Math.sin(angle) * 2;
            }
            mesh.scale.set(
              1 + Math.sin(time * 1.5 + index) * 0.1,
              1 + Math.sin(time * 1.5 + index) * 0.1,
              1 + Math.sin(time * 1.5 + index) * 0.1
            );
            break;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [section, color]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 400,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 40,
        border: `2px solid ${color}`,
        boxShadow: `0 0 20px ${color}40`
      }}
    />
  );
}
