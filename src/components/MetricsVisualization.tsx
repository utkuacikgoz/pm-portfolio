import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Metric {
  label: string;
  before: number;
  after: number;
  unit: string;
  color: string;
}

interface MetricsVisualizationProps {
  metrics: Metric[];
  sectionColor: string;
}

export default function MetricsVisualization({ metrics, sectionColor }: MetricsVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x0a0a0a, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(sectionColor, 1.2);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create metric bars (before/after comparison)
    const barWidth = 0.8;
    const spacing = 3.5;
    const maxBarHeight = 4;

    // Find max value for scaling
    const allValues = metrics.flatMap(m => [m.before, m.after]);
    const maxValue = Math.max(...allValues);

    barsRef.current = [];

    metrics.forEach((metric, index) => {
      const xPos = (index - metrics.length / 2) * spacing + spacing / 2;

      // Before bar
      const beforeHeight = (metric.before / maxValue) * maxBarHeight;
      const beforeGeom = new THREE.BoxGeometry(barWidth * 0.4, beforeHeight, barWidth * 0.4);
      const beforeMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.5,
        wireframe: false
      });
      const beforeMesh = new THREE.Mesh(beforeGeom, beforeMat);
      beforeMesh.position.set(xPos - barWidth * 0.3, beforeHeight / 2 - 2, 0);
      scene.add(beforeMesh);
      barsRef.current.push(beforeMesh);

      // After bar
      const afterHeight = (metric.after / maxValue) * maxBarHeight;
      const afterGeom = new THREE.BoxGeometry(barWidth * 0.4, afterHeight, barWidth * 0.4);
      const afterMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(metric.color),
        metalness: 0.7,
        roughness: 0.3,
        emissive: new THREE.Color(metric.color),
        emissiveIntensity: 0.2
      });
      const afterMesh = new THREE.Mesh(afterGeom, afterMat);
      afterMesh.position.set(xPos + barWidth * 0.3, afterHeight / 2 - 2, 0);
      scene.add(afterMesh);
      barsRef.current.push(afterMesh);

      // Connector line
      const lineGeom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        xPos - barWidth * 0.3, beforeHeight / 2 - 2, 0,
        xPos + barWidth * 0.3, afterHeight / 2 - 2, 0
      ]);
      lineGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(metric.color),
        linewidth: 1,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeom, lineMat);
      scene.add(line);
    });

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.008;

      barsRef.current.forEach((mesh, index) => {
        // Gentle floating animation
        mesh.position.y += Math.sin(time + index * 0.3) * 0.002;
        
        // Slight rotation for depth
        mesh.rotation.x = Math.sin(time * 0.3 + index) * 0.05;
        mesh.rotation.z = Math.cos(time * 0.3 + index) * 0.05;
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
  }, [metrics, sectionColor]);

  return (
    <div style={{ marginBottom: 40 }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 300,
          borderRadius: 4,
          overflow: 'hidden',
          border: `2px solid ${sectionColor}`,
          boxShadow: `0 0 20px ${sectionColor}40`
        }}
      />
      
      {/* Legend below chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`,
        gap: 16,
        marginTop: 24,
        padding: '0 16px'
      }}>
        {metrics.map((metric, idx) => (
          <div key={idx} style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#999'
          }}>
            <div style={{
              color: metric.color,
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 4
            }}>
              {metric.before} → {metric.after}{metric.unit}
            </div>
            <div>{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
