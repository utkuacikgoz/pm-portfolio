import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Decision {
  label: string;
  speed: number; // 0-100
  risk: number; // 0-100
  isChosen: boolean;
  color: string;
}

interface DecisionMatrixProps {
  decisions: Decision[];
  sectionColor: string;
}

export default function DecisionMatrix({ decisions, sectionColor }: DecisionMatrixProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bubblesRef = useRef<THREE.Mesh[]>([]);
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
    camera.position.z = 8;

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

    // Create grid background (Speed vs Risk axes)
    const gridSize = 8;
    const gridHelper = new THREE.GridHelper(gridSize, 4, 0x333333, 0x222222);
    gridHelper.position.z = -2;
    scene.add(gridHelper);

    // Add axis labels
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = '#666';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('SPEED', 10, 30);
      ctx.fillText('RISK', 10, 260);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), material);
      mesh.position.z = -2.1;
    }

    bubblesRef.current = [];

    // Create decision bubbles
    decisions.forEach((decision, index) => {
      const x = (decision.speed / 50) - 4;
      const y = (decision.risk / 50) - 4;
      const size = decision.isChosen ? 0.6 : 0.4;

      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(decision.color),
        metalness: 0.7,
        roughness: 0.2,
        emissive: new THREE.Color(decision.color),
        emissiveIntensity: decision.isChosen ? 0.4 : 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      mesh.userData = { isChosen: decision.isChosen, index, label: decision.label };
      scene.add(mesh);
      bubblesRef.current.push(mesh);

      // Add connecting line from non-chosen to chosen
      if (decision.isChosen) {
        const chosenPos = mesh.position;
        decisions.forEach((d, i) => {
          if (i !== index && !d.isChosen) {
            const fromX = (d.speed / 50) - 4;
            const fromY = (d.risk / 50) - 4;
            const lineGeom = new THREE.BufferGeometry();
            const vertices = new Float32Array([
              fromX, fromY, 0,
              chosenPos.x, chosenPos.y, 0
            ]);
            lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            const lineMat = new THREE.LineBasicMaterial({
              color: new THREE.Color(sectionColor),
              transparent: true,
              opacity: 0.2,
              linewidth: 1
            });
            const line = new THREE.Line(lineGeom, lineMat);
            scene.add(line);
          }
        });
      }
    });

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      bubblesRef.current.forEach((mesh) => {
        const index = mesh.userData.index;
        const isHovered = hoveredIndex === index;
        const baseEmissiveIntensity = mesh.userData.isChosen ? 0.4 : 0.1;
        
        if (mesh.userData.isChosen) {
          mesh.scale.set(isHovered ? 1.2 : 1, isHovered ? 1.2 : 1, isHovered ? 1.2 : 1);
          mesh.rotation.x += 0.005;
          mesh.rotation.y += 0.008;
          mesh.position.z = Math.sin(time) * 0.3;
        } else {
          const scale = 0.8 + Math.sin(time * 2 + index) * 0.15;
          mesh.scale.set(isHovered ? scale * 1.15 : scale, isHovered ? scale * 1.15 : scale, isHovered ? scale * 1.15 : scale);
          mesh.rotation.x += 0.002;
          mesh.rotation.y += 0.003;
        }
        
        // Update emissive intensity on hover
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissiveIntensity = isHovered ? 0.6 : baseEmissiveIntensity;
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
  }, [decisions, sectionColor, hoveredIndex]);

  return (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 700,
        color: sectionColor,
        letterSpacing: 0.5,
        marginBottom: 16
      }}>
        Strategic Decision Matrix
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginTop: 20,
        padding: '0 16px'
      }}>
        {decisions.map((d, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              padding: '12px',
              background: hoveredIndex === idx ? `${d.color}30` : d.isChosen ? `${d.color}20` : '#0a0a0a',
              border: `2px solid ${hoveredIndex === idx ? d.color : d.color}`,
              borderRadius: 4,
              fontSize: 12,
              color: '#ccc',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: hoveredIndex === idx ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: hoveredIndex === idx ? `0 4px 16px ${d.color}40` : 'none'
            }}
          >
            <div style={{ fontWeight: 700, color: d.color, marginBottom: 8 }}>
              {d.isChosen && '✓ '}{d.label}
            </div>
            <div style={{ marginBottom: 4, color: '#999' }}>
              <span style={{ color: d.color, fontWeight: 600 }}>Speed:</span> {d.speed}
            </div>
            <div style={{ color: '#999' }}>
              <span style={{ color: d.color, fontWeight: 600 }}>Risk:</span> {d.risk}
            </div>
            {d.isChosen && (
              <div style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: `1px solid ${d.color}40`,
                fontSize: 10,
                color: d.color,
                fontWeight: 600
              }}>
                CHOSEN DECISION
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Interactive Legend */}
      {hoveredIndex !== null && (
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#0a0a0a',
          border: `1px solid ${decisions[hoveredIndex].color}40`,
          borderRadius: 4,
          fontSize: 12,
          color: '#ccc'
        }}>
          <div style={{
            color: decisions[hoveredIndex].color,
            fontWeight: 700,
            marginBottom: 6
          }}>
            {decisions[hoveredIndex].label}
          </div>
          <div style={{ color: '#999', fontSize: 11, lineHeight: 1.6 }}>
            <div>Speed Index: <span style={{ color: sectionColor, fontWeight: 600 }}>{decisions[hoveredIndex].speed}/100</span> - How quickly this decision can be executed</div>
            <div style={{ marginTop: 4 }}>Risk Level: <span style={{ color: sectionColor, fontWeight: 600 }}>{decisions[hoveredIndex].risk}/100</span> - Potential downside or uncertainty</div>
            {decisions[hoveredIndex].isChosen && (
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${decisions[hoveredIndex].color}40`, color: decisions[hoveredIndex].color }}>
                This decision was selected for execution.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
