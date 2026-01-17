import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Initiative {
  label: string;
  effort: number; // 0-100
  impact: number; // 0-100
  timeToValue: number; // 0-100 (months, lower is better)
  color: string;
}

interface EffortImpactBubblesProps {
  initiatives: Initiative[];
  sectionColor: string;
}

export default function EffortImpactBubbles({ initiatives, sectionColor }: EffortImpactBubblesProps) {
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

    // Create quadrant background (Effort vs Impact)
    const gridHelper = new THREE.GridHelper(8, 4, 0x333333, 0x222222);
    gridHelper.position.z = -2;
    scene.add(gridHelper);

    bubblesRef.current = [];

    // Create initiative bubbles
    initiatives.forEach((init, index) => {
      const x = (init.effort / 50) - 4;
      const y = (init.impact / 50) - 4;
      const bubbleSize = init.timeToValue / 100; // Smaller = faster time to value

      const geometry = new THREE.SphereGeometry(Math.max(0.3, bubbleSize * 0.8), 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(init.color),
        metalness: 0.6,
        roughness: 0.3,
        emissive: new THREE.Color(init.color),
        emissiveIntensity: 0.2
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, 0);
      mesh.userData = {
        effort: init.effort,
        impact: init.impact,
        timeToValue: init.timeToValue,
        label: init.label,
        index
      };
      scene.add(mesh);
      bubblesRef.current.push(mesh);
    });

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.008;

      bubblesRef.current.forEach((mesh, idx) => {
        // Floating animation
        mesh.position.y += Math.sin(time * 1.5 + idx) * 0.002;
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.005;

        // Pulse based on impact
        const impact = mesh.userData.impact / 100;
        const scale = 1 + Math.sin(time * 2 + idx * 0.5) * 0.1 * impact;
        mesh.scale.set(scale, scale, scale);
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
  }, [initiatives, sectionColor]);

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
        Effort vs. Impact Prioritization
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 16,
        marginTop: 20,
        padding: '0 16px'
      }}>
        {initiatives.map((init, idx) => (
          <div key={idx} style={{
            padding: '12px',
            background: '#0a0a0a',
            border: `1px solid ${init.color}`,
            borderRadius: 4,
            fontSize: 11,
            color: '#ccc'
          }}>
            <div style={{ fontWeight: 700, color: init.color, marginBottom: 4 }}>
              {init.label}
            </div>
            <div>Effort: {init.effort}</div>
            <div>Impact: {init.impact}</div>
            <div>Time to Value: {init.timeToValue} days</div>
          </div>
        ))}
      </div>
    </div>
  );
}
