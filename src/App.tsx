import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { useCaseStudy } from "./content/useCaseStudy";
import { BEAT_TO_SCENE, BeatId } from "./scene/beatMap";

import SystemGraph from "./scene/SystemGraph";

import Chaos from "./sections/Chaos";
import Constraints from "./sections/Constraints";
import Decisions from "./sections/Decisions";
import Deterministic from "./sections/Deterministic";
import Proof from "./sections/Proof";

const isMobile = window.innerWidth < 768;

export default function App() {
  const { caseStudy, setCase } = useCaseStudy();
  const [activeBeat, setActiveBeat] = useState<BeatId>("chaos");
  const [is3DLoaded, setIs3DLoaded] = useState(false);

  const activeScene = BEAT_TO_SCENE[activeBeat];

  return (
    <div style={{ minHeight: "300vh", background: "#000" }}>
      {/* FIXED 3D BACKGROUND - hide on mobile */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background:
              "radial-gradient(1200px 800px at 50% 30%, #0b0f19 0%, #05070c 60%, #000 100%)",
          }}
        >
          {!is3DLoaded && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              opacity: 0.5,
              fontSize: 14
            }}>
              Loading...
            </div>
          )}
          <Canvas 
            camera={{ position: [0, 0, 6], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={() => setIs3DLoaded(true)}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[4, 4, 4]} intensity={1} />
            <SystemGraph scene={activeScene} />
          </Canvas>
        </div>
      )}

      {/* CASE STUDY NAVIGATION */}
      <div style={{ 
        position: 'fixed',
        top: isMobile ? 16 : 24,
        right: isMobile ? 16 : 24,
        zIndex: 10,
        display: 'flex',
        gap: isMobile ? 8 : 12,
        flexDirection: isMobile ? 'row' : 'column'
      }}>
        <button 
          onClick={() => setCase("bilira")}
          style={{
            padding: isMobile ? '8px 12px' : '12px 20px',
            background: caseStudy.id === 'bilira' ? '#fff' : 'rgba(255,255,255,0.1)',
            color: caseStudy.id === 'bilira' ? '#000' : '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: isMobile ? 12 : 14,
            fontWeight: 500
          }}
        >
          BiLira
        </button>
        <button 
          onClick={() => setCase("upshift")}
          style={{
            padding: isMobile ? '8px 12px' : '12px 20px',
            background: caseStudy.id === 'upshift' ? '#fff' : 'rgba(255,255,255,0.1)',
            color: caseStudy.id === 'upshift' ? '#000' : '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: isMobile ? 12 : 14,
            fontWeight: 500
          }}
        >
          Upshift
        </button>
        <button 
          onClick={() => setCase("mestores")}
          style={{
            padding: isMobile ? '8px 12px' : '12px 20px',
            background: caseStudy.id === 'mestores' ? '#fff' : 'rgba(255,255,255,0.1)',
            color: caseStudy.id === 'mestores' ? '#000' : '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: isMobile ? 12 : 14,
            fontWeight: 500
          }}
        >
          Mestores
        </button>
      </div>

      {/* SCROLLING CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "#fff",
          padding: isMobile ? "80px 20px" : "120px 24px",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {/* HERO SECTION */}
        <div style={{ marginBottom: isMobile ? 80 : 120, minHeight: isMobile ? '60vh' : '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: isMobile ? 36 : 56, marginBottom: 16, fontWeight: 600 }}>Utku Acikgoz</h1>
          <p style={{ fontSize: isMobile ? 16 : 20, opacity: 0.7, marginBottom: 32, lineHeight: 1.6 }}>
            Senior Technical Product Manager<br/>
            Fintech & Compliance • AI-Driven Growth
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <a href="mailto:hello@utkuacikgoz.com" style={{ color: '#fff', opacity: 0.8, textDecoration: 'none', fontSize: isMobile ? 14 : 16 }}>Email</a>
            <a href="https://linkedin.com/in/utkuacikgoz" target="_blank" rel="noopener" style={{ color: '#fff', opacity: 0.8, textDecoration: 'none', fontSize: isMobile ? 14 : 16 }}>LinkedIn</a>
            <a href="https://utkuacikgoz.com" target="_blank" rel="noopener" style={{ color: '#fff', opacity: 0.8, textDecoration: 'none', fontSize: isMobile ? 14 : 16 }}>Website</a>
          </div>
        </div>

        <h2 style={{ fontSize: isMobile ? 28 : 36, marginBottom: isMobile ? 40 : 60 }}>{caseStudy.title}</h2>

        <section
          onMouseEnter={() => !isMobile && setActiveBeat("chaos")}
          style={{ minHeight: isMobile ? "auto" : "60vh", marginBottom: isMobile ? 60 : 0 }}
        >
          <Chaos />
        </section>

        <section
          onMouseEnter={() => !isMobile && setActiveBeat("constraints")}
          style={{ minHeight: isMobile ? "auto" : "60vh", marginBottom: isMobile ? 60 : 0 }}
        >
          <Constraints />
        </section>

        <section
          onMouseEnter={() => !isMobile && setActiveBeat("decisions")}
          style={{ minHeight: isMobile ? "auto" : "60vh", marginBottom: isMobile ? 60 : 0 }}
        >
          <Decisions />
        </section>

        <section
          onMouseEnter={() => !isMobile && setActiveBeat("deterministic")}
          style={{ minHeight: isMobile ? "auto" : "60vh", marginBottom: isMobile ? 60 : 0 }}
        >
          <Deterministic />
        </section>

        <section
          onMouseEnter={() => !isMobile && setActiveBeat("proof")}
          style={{ minHeight: isMobile ? "auto" : "60vh", marginBottom: isMobile ? 60 : 0 }}
        >
          <Proof />
        </section>
      </div>
    </div>
  );
}