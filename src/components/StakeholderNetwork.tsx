import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Stakeholder {
  name: string;
  role: string;
  color: string;
}

interface StakeholderNetworkProps {
  stakeholders: Stakeholder[];
  sectionColor: string;
}

export default function StakeholderNetwork({ stakeholders, sectionColor }: StakeholderNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);

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
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(sectionColor, 1.5);
    pointLight.position.set(8, 8, 8);
    scene.add(pointLight);

    // Create central node (You - the PM)
    const centerGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sectionColor),
      metalness: 0.8,
      roughness: 0.2,
      emissive: new THREE.Color(sectionColor),
      emissiveIntensity: 0.3
    });
    const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
    centerMesh.userData = { isCenter: true };
    scene.add(centerMesh);
    nodesRef.current.push(centerMesh);

    // Position stakeholders in orbit
    const orbitRadius = 4;
    const positions: THREE.Vector3[] = [centerMesh.position.clone()];

    stakeholders.forEach((stakeholder, index) => {
      const angle = (index / stakeholders.length) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadius;
      const y = Math.sin(angle) * orbitRadius;
      const z = Math.sin(angle * 0.5) * 1.5;

      positions.push(new THREE.Vector3(x, y, z));

      // Create stakeholder node
      const geometry = new THREE.SphereGeometry(0.4, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(stakeholder.color),
        metalness: 0.6,
        roughness: 0.3,
        emissive: new THREE.Color(stakeholder.color),
        emissiveIntensity: 0.15
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.userData = { role: stakeholder.role, index, orbitAngle: angle, orbitRadius };
      scene.add(mesh);
      nodesRef.current.push(mesh);

      // Connection line from center to stakeholder
      const lineGeom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        0, 0, 0,
        x, y, z
      ]);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(stakeholder.color),
        transparent: true,
        opacity: 0.3,
        linewidth: 2
      });
      const line = new THREE.Line(lineGeom, lineMat);
      scene.add(line);
    });

    // Create secondary connections between stakeholders (cross-functional)
    for (let i = 1; i < nodesRef.current.length; i++) {
      for (let j = i + 1; j < Math.min(i + 3, nodesRef.current.length); j++) {
        const n1 = nodesRef.current[i];
        const n2 = nodesRef.current[j];
        if (n1 && n2 && !n1.userData.isCenter && !n2.userData.isCenter) {
          const lineGeom = new THREE.BufferGeometry();
          const vertices = new Float32Array([
            n1.position.x, n1.position.y, n1.position.z,
            n2.position.x, n2.position.y, n2.position.z
          ]);
          lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
          const lineMat = new THREE.LineBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.15,
            linewidth: 1
          });
          const line = new THREE.Line(lineGeom, lineMat);
          scene.add(line);
        }
      }
    }

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.008;

      nodesRef.current.forEach((mesh, idx) => {
        if (mesh.userData.isCenter) {
          // Center node pulses
          const scale = 1 + Math.sin(time * 1.5) * 0.1;
          mesh.scale.set(scale, scale, scale);
          mesh.rotation.x += 0.005;
          mesh.rotation.y += 0.008;
        } else {
          // Stakeholders orbit
          const orbitAngle = mesh.userData.orbitAngle + time * 0.3;
          const orbitRadius = mesh.userData.orbitRadius;
          mesh.position.x = Math.cos(orbitAngle) * orbitRadius;
          mesh.position.y = Math.sin(orbitAngle) * orbitRadius;
          mesh.position.z = Math.sin(orbitAngle * 0.5) * 1.5;

          // Gentle rotation
          mesh.rotation.x += 0.002;
          mesh.rotation.y += 0.003;

          // Pulse with breathing effect
          const pulse = 1 + Math.sin(time * 2 + idx * 0.4) * 0.12;
          mesh.scale.set(pulse, pulse, pulse);
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
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [stakeholders, sectionColor]);

  return (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 700,
        color: sectionColor,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16
      }}>
        Cross-Functional Leadership
      </h3>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 320,
          borderRadius: 4,
          overflow: 'hidden',
          border: `2px solid ${sectionColor}`,
          boxShadow: `0 0 20px ${sectionColor}40`
        }}
      />
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
        marginTop: 20,
        padding: '0 16px'
      }}>
        {stakeholders.map((s, idx) => (
          <div key={idx} style={{
            padding: '10px',
            background: '#0a0a0a',
            border: `1px solid ${s.color}`,
            borderRadius: 4,
            fontSize: 11,
            color: '#ccc'
          }}>
            <div style={{ fontWeight: 700, color: s.color, marginBottom: 2 }}>
              {s.name}
            </div>
            <div style={{ fontSize: 10, color: '#999' }}>{s.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
