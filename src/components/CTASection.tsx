import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CTASectionProps {
  color: string;
}

export default function CTASection({ color }: CTASectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
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
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x0a0a0a, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(color, 1.5);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Create floating particles
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation loop
    let time = 0;
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Update particle positions
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];

        // Wrap around bounds
        if (Math.abs(positions[i * 3]) > 3) velocities[i * 3] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 3) velocities[i * 3 + 1] *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 3) velocities[i * 3 + 2] *= -1;
      }

      geometry.attributes.position.needsUpdate = true;
      particles.rotation.x += 0.0001;
      particles.rotation.y += 0.0002;

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
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [color]);

  return (
    <div style={{
      position: 'relative',
      minHeight: '500px',
      marginTop: 120,
      borderTop: `3px solid ${color}`,
      borderBottom: `3px solid ${color}`,
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* 3D Background */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0
        }}
      />

      {/* Content overlay */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '500px',
        padding: '60px 24px',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: 48,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 16,
          letterSpacing: -0.5
        }}>
          Let's Work Together
        </h2>

        <p style={{
          fontSize: 18,
          color: color,
          marginBottom: 40,
          fontWeight: 600,
          maxWidth: 600
        }}>
          Ready to discuss how to apply senior PM thinking to your product challenges? Let's schedule a call.
        </p>

        <a
          href="https://calendly.com/utkuacikgoz"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '16px 48px',
            background: color,
            color: '#000',
            textDecoration: 'none',
            fontSize: 16,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 1,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: `0 8px 32px ${color}60`,
            borderRadius: '4px'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 12px 48px ${color}80`;
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 8px 32px ${color}60`;
          }}
        >
          Book a Call
        </a>

        <div style={{
          display: 'flex',
          gap: 32,
          marginTop: 60,
          justifyContent: 'center',
          maxWidth: 800
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 24,
              fontWeight: 900,
              color: color,
              marginBottom: 8
            }}>
              30 MIN
            </div>
            <p style={{
              fontSize: 12,
              color: '#888'
            }}>
              Quick chat about your product vision
            </p>
          </div>
          <div style={{
            width: '1px',
            background: color,
            opacity: 0.3
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 24,
              fontWeight: 900,
              color: color,
              marginBottom: 8
            }}>
              FREE
            </div>
            <p style={{
              fontSize: 12,
              color: '#888'
            }}>
              No sales pitch, just strategic thinking
            </p>
          </div>
        </div>
      </div>

      {/* Gradient overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
        zIndex: 5
      }} />
    </div>
  );
}
