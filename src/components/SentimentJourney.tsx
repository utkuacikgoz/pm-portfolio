import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SentimentJourneyProps {
  currentSection: number;
  sectionColor: string;
  sectionLabels: string[];
  sentimentScores: number[];
}

// Map sentiment scores to emotional states with emojis
function getEmotionalState(score: number): { emoji: string; emotion: string } {
  if (score < 20) return { emoji: '😤', emotion: 'Frustrated' };
  if (score < 35) return { emoji: '😕', emotion: 'Confused' };
  if (score < 50) return { emoji: '😕', emotion: 'Concerned' };
  if (score < 65) return { emoji: '🤔', emotion: 'Cautious' };
  if (score < 80) return { emoji: '😊', emotion: 'Optimistic' };
  if (score < 90) return { emoji: '😄', emotion: 'Happy' };
  return { emoji: '🎉', emotion: 'Satisfied' };
}

export default function SentimentJourney({ currentSection, sectionColor, sectionLabels, sentimentScores }: SentimentJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const curveRef = useRef<THREE.Line | null>(null);
  const thermometerRef = useRef<THREE.Mesh | null>(null);
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

    // Create sentiment curve
    const points: THREE.Vector3[] = [];
    const spacing = 3;
    const baseY = -2;

    sentimentScores.forEach((score, index) => {
      const x = (index - 2) * spacing;
      const y = baseY + (score / 100) * 4;
      points.push(new THREE.Vector3(x, y, 0));
    });

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(50);
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(sectionColor),
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    const curveLineRef = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveLineRef);
    curveRef.current = curveLineRef;

    // Create sentiment checkpoints (circles along curve)
    points.forEach((point, index) => {
      const geometry = new THREE.SphereGeometry(0.25, 32, 32);
      const isActive = index === currentSection;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(sectionColor),
        metalness: 0.7,
        roughness: 0.2,
        emissive: new THREE.Color(sectionColor),
        emissiveIntensity: isActive ? 0.5 : 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(point);
      mesh.userData = { isActive, score: sentimentScores[index], index };
      scene.add(mesh);
    });

    // Create thermometer (vertical gauge on right side)
    const thermometerGroup = new THREE.Group();

    // Thermometer background
    const bgGeometry = new THREE.BoxGeometry(0.4, 5, 0.1);
    const bgMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.7
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.set(6.5, 0, 0);
    thermometerGroup.add(bgMesh);

    // Thermometer fill (animated based on current section)
    const fillHeight = (sentimentScores[currentSection] / 100) * 5;
    const fillGeometry = new THREE.BoxGeometry(0.35, fillHeight, 0.15);
    const fillMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sectionColor),
      metalness: 0.6,
      roughness: 0.3,
      emissive: new THREE.Color(sectionColor),
      emissiveIntensity: 0.3
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.position.set(6.5, -2.5 + fillHeight / 2, 0);
    thermometerRef.current = fillMesh;
    thermometerGroup.add(fillMesh);

    // Thermometer scale marks
    for (let i = 0; i <= 5; i++) {
      const markGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05);
      const markMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.5,
        roughness: 0.5
      });
      const markMesh = new THREE.Mesh(markGeometry, markMaterial);
      markMesh.position.set(6.8, -2.5 + (i / 5) * 5, 0);
      thermometerGroup.add(markMesh);
    }

    scene.add(thermometerGroup);

    // Create area under curve (gradient effect)
    const areaPoints = [...points];
    areaPoints.push(new THREE.Vector3(points[points.length - 1].x, baseY, 0));
    areaPoints.push(new THREE.Vector3(points[0].x, baseY, 0));
    areaPoints.push(new THREE.Vector3(points[0].x, points[0].y, 0));

    const areaGeometry = new THREE.BufferGeometry();
    const areaVertices = new Float32Array(areaPoints.flatMap(p => [p.x, p.y, p.z]));
    areaGeometry.setAttribute('position', new THREE.BufferAttribute(areaVertices, 3));

    // Create indices for triangulation
    const indices: number[] = [];
    for (let i = 1; i < areaPoints.length - 1; i++) {
      indices.push(0, i, i + 1);
    }
    areaGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

    const areaMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sectionColor),
      metalness: 0.2,
      roughness: 0.7,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const areaMesh = new THREE.Mesh(areaGeometry, areaMaterial);
    scene.add(areaMesh);

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Animate thermometer fill
      if (thermometerRef.current) {
        const targetHeight = (sentimentScores[currentSection] / 100) * 5;
        const currentHeight = thermometerRef.current.scale.y;
        const newHeight = currentHeight + (targetHeight - currentHeight) * 0.05;
        thermometerRef.current.scale.y = newHeight;
        thermometerRef.current.position.y = -2.5 + (newHeight * 5) / 2;
      }

      // Animate checkpoints
      scene.children.forEach((child) => {
        if (child.userData?.isActive !== undefined) {
          const scale = 1 + Math.sin(time * 2) * 0.15;
          child.scale.set(scale, scale, scale);
          child.rotation.z = time * 0.3;
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
  }, [currentSection, sectionColor]);

  return (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 700,
        color: sectionColor,
        letterSpacing: 0.5,
        marginBottom: 16
      }}>
        Customer Sentiment Journey
      </h3>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 280,
          borderRadius: 4,
          overflow: 'hidden',
          border: `2px solid ${sectionColor}`,
          boxShadow: `0 0 20px ${sectionColor}40`
        }}
      />
      
      {/* Legend with Emojis */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12,
        marginTop: 20,
        padding: '0 16px'
      }}>
        {sectionLabels.map((label, idx) => {
          const score = sentimentScores[idx];
          const { emoji, emotion } = getEmotionalState(score);
          return (
            <div key={idx} style={{
              textAlign: 'center',
              fontSize: 11,
              color: '#666',
              padding: '12px',
              borderRadius: 4,
              background: idx === currentSection ? `${sectionColor}15` : 'transparent',
              border: idx === currentSection ? `1px solid ${sectionColor}40` : 'none',
              transition: 'all 0.3s'
            }}>
              <div style={{
                fontSize: 32,
                marginBottom: 6,
                lineHeight: 1
              }}>
                {emoji}
              </div>
              <div style={{
                color: idx === currentSection ? sectionColor : '#999',
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 4,
                transition: 'color 0.3s'
              }}>
                {Math.round(score)}%
              </div>
              <div style={{
                fontSize: 10,
                color: idx === currentSection ? sectionColor : '#666',
                transition: 'color 0.3s',
                marginBottom: 4
              }}>
                {emotion}
              </div>
              <div style={{
                fontSize: 9,
                color: '#666',
                fontWeight: 600
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interpretation */}
      <div style={{
        marginTop: 20,
        padding: '12px 16px',
        background: '#0a0a0a',
        border: `1px solid ${sectionColor}40`,
        borderRadius: 4,
        fontSize: 12,
        color: '#999'
      }}>
        <strong style={{ color: sectionColor }}>Emotional Arc:</strong> Tracks how customer sentiment evolved through each stage. From initial frustration with the problem, through understanding and caution, to optimism, happiness, and ultimate satisfaction with the solution.
      </div>
    </div>
  );
}
