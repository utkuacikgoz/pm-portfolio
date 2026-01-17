import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface NarrativeSceneProps {
  section: number;
  color: string;
}

export default function NarrativeScene({ section, color }: NarrativeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const elementsRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const mouseRef = useRef({ x: 0, y: 0, isDragging: false });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Mouse event handlers for interaction
    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDragging = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (mouseRef.current.isDragging && containerRef.current) {
        const deltaMove = {
          x: e.clientX - mouseRef.current.x,
          y: e.clientY - mouseRef.current.y
        };
        
        rotationRef.current.targetY += deltaMove.x * 0.005;
        rotationRef.current.targetX += deltaMove.y * 0.005;
        
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      }
    };

    const onMouseUp = () => {
      mouseRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.003;
      camera.position.z = Math.max(2, Math.min(15, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(color, 1.8);
    pointLight.position.set(6, 6, 6);
    scene.add(pointLight);

    // Create narrative visualization
    const colorObj = new THREE.Color(color);
    elementsRef.current = [];

    // SECTION 0: PROBLEM (Diverging chaos)
    if (section === 0) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const distance = 2 + Math.random() * 0.5;
        
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshStandardMaterial({
          color: colorObj,
          metalness: 0.6,
          roughness: 0.4,
          emissive: colorObj,
          emissiveIntensity: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          Math.cos(angle) * distance,
          Math.sin(angle) * distance,
          Math.random() - 0.5
        );
        mesh.userData = { angle, distance, baseY: Math.sin(angle) * distance };
        scene.add(mesh);
        elementsRef.current.push(mesh);
      }
    }
    // SECTION 1: CONSTRAINTS (Converging pyramid)
    else if (section === 1) {
      const geometry = new THREE.ConeGeometry(2.5, 4, 6);
      const material = new THREE.MeshStandardMaterial({
        color: colorObj,
        metalness: 0.7,
        roughness: 0.3,
        wireframe: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      elementsRef.current.push(mesh);

      // Add constraint rings
      for (let i = 0; i < 3; i++) {
        const ringGeom = new THREE.TorusGeometry(2.5 - i * 0.6, 0.15, 32, 16);
        const ringMat = new THREE.MeshStandardMaterial({
          color: colorObj,
          metalness: 0.8,
          roughness: 0.2,
          emissive: colorObj,
          emissiveIntensity: 0.15
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.y = 1 - i * 0.8;
        ring.rotation.x = Math.PI / 4;
        scene.add(ring);
        elementsRef.current.push(ring);
      }
    }
    // SECTION 2: APPROACH (Interconnected solution)
    else if (section === 2) {
      const positions = [
        { x: 0, y: 0, z: 0, size: 0.8 },
        { x: 2, y: 1, z: 0, size: 0.5 },
        { x: -2, y: 1, z: 0, size: 0.5 },
        { x: 1.5, y: -1.5, z: 0, size: 0.5 },
        { x: -1.5, y: -1.5, z: 0, size: 0.5 }
      ];

      // Central sphere
      const coreGeom = new THREE.IcosahedronGeometry(0.8, 4);
      const coreMat = new THREE.MeshStandardMaterial({
        color: colorObj,
        metalness: 0.8,
        roughness: 0.2,
        wireframe: true
      });
      const core = new THREE.Mesh(coreGeom, coreMat);
      scene.add(core);
      elementsRef.current.push(core);

      // Satellite spheres
      positions.slice(1).forEach((pos) => {
        const geom = new THREE.SphereGeometry(pos.size, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: colorObj,
          metalness: 0.6,
          roughness: 0.4,
          emissive: colorObj,
          emissiveIntensity: 0.1
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.userData = { orbitAngle: 0, orbitRadius: Math.sqrt(pos.x * pos.x + pos.y * pos.y) };
        scene.add(mesh);
        elementsRef.current.push(mesh);

        // Connection lines
        const lineGeom = new THREE.BufferGeometry();
        const vertices = new Float32Array([0, 0, 0, pos.x, pos.y, pos.z]);
        lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 0.3
        });
        const line = new THREE.Line(lineGeom, lineMat);
        scene.add(line);
      });
    }
    // SECTION 3: RESULTS (Growth trajectory)
    else if (section === 3) {
      for (let i = 0; i < 5; i++) {
        const height = 0.8 + i * 0.8;
        const geom = new THREE.BoxGeometry(0.6, height, 0.6);
        const mat = new THREE.MeshStandardMaterial({
          color: colorObj,
          metalness: 0.6,
          roughness: 0.4,
          emissive: colorObj,
          emissiveIntensity: 0.15
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set((i - 2) * 1.2, -height / 2 + 0.5, 0);
        mesh.userData = { targetY: -height / 2 + 0.5, index: i };
        scene.add(mesh);
        elementsRef.current.push(mesh);
      }
    }
    // SECTION 4: LEARNINGS (Knowledge nodes)
    else if (section === 4) {
      const nodePositions = [
        { x: 0, y: 0, z: 0 },
        { x: 2.5, y: 0, z: 0 },
        { x: -2.5, y: 0, z: 0 },
        { x: 0, y: 2.5, z: 0 },
        { x: 0, y: -2.5, z: 0 }
      ];

      nodePositions.forEach((pos, i) => {
        const geom = new THREE.SphereGeometry(0.35, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: colorObj,
          metalness: 0.8,
          roughness: 0.2,
          emissive: colorObj,
          emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(pos as any);
        mesh.userData = { pulseIndex: i };
        scene.add(mesh);
        elementsRef.current.push(mesh);
      });

      // Connection network
      for (let i = 1; i < nodePositions.length; i++) {
        const lineGeom = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          0, 0, 0,
          nodePositions[i].x, nodePositions[i].y, nodePositions[i].z
        ]);
        lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: colorObj,
          transparent: true,
          opacity: 0.4,
          linewidth: 2
        });
        const line = new THREE.Line(lineGeom, lineMat);
        scene.add(line);
      }
    }

    // Animation
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Smooth rotation based on mouse
      rotationRef.current.x += (rotationRef.current.targetX - rotationRef.current.x) * 0.1;
      rotationRef.current.y += (rotationRef.current.targetY - rotationRef.current.y) * 0.1;

      const group = new THREE.Group();
      elementsRef.current.forEach((mesh) => {
        mesh.parent && mesh.parent.remove(mesh);
        group.add(mesh);
      });
      group.rotation.x = rotationRef.current.x;
      group.rotation.y = rotationRef.current.y;
      scene.add(group);

      elementsRef.current.forEach((mesh, i) => {
        if (section === 0) {
          // Problem: elements diverge outward
          mesh.position.x += Math.cos(mesh.userData.angle) * 0.002;
          mesh.position.y += Math.sin(mesh.userData.angle) * 0.002;
          mesh.rotation.x += 0.01;
          mesh.rotation.y += 0.01;
        } else if (section === 1) {
          // Constraints: stable rotation
          if (i === 0) mesh.rotation.z += 0.003;
          else mesh.rotation.x += 0.005;
        } else if (section === 2) {
          // Approach: orbital motion
          if (mesh.userData.orbitRadius) {
            const angle = time * 0.8 + i;
            mesh.position.x = Math.cos(angle) * mesh.userData.orbitRadius;
            mesh.position.y = Math.sin(angle) * mesh.userData.orbitRadius;
          } else {
            mesh.rotation.x += 0.003;
            mesh.rotation.y += 0.005;
          }
        } else if (section === 3) {
          // Results: pulsing growth
          mesh.scale.y = 1 + Math.sin(time * 1.5 + i * 0.3) * 0.1;
          mesh.position.y = mesh.userData.targetY + Math.sin(time * 2 + i) * 0.05;
        } else if (section === 4) {
          // Learnings: pulsing network
          const scale = 1 + Math.sin(time * 2 + mesh.userData.pulseIndex) * 0.15;
          mesh.scale.set(scale, scale, scale);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

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
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
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
        height: '350px',
        cursor: 'grab',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    />
  );
}
