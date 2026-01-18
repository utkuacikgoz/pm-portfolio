import { useState, useEffect } from 'react';
import { CaseStudyId } from '../content/useCaseStudy';

type Props = {
  onCaseClick: (caseId: CaseStudyId) => void;
};

export default function LandingPage({ onCaseClick }: Props) {
  const [vortexComplete, setVortexComplete] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CaseStudyId | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVortexComplete(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = (caseId: CaseStudyId) => {
    setSelectedCard(caseId);
    setTimeout(() => onCaseClick(caseId), 300);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Vortex animation */}
      {!vortexComplete && <VortexAnimation />}

      {/* Main content */}
      <div style={{
        opacity: vortexComplete ? 1 : 0,
        transition: 'opacity 1s ease',
        padding: '60px 24px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        {/* Header */}
        <header style={{ 
          textAlign: 'center', 
          marginBottom: 100,
          animation: vortexComplete ? 'slideInDown 0.8s ease 0.2s both' : 'none'
        }}>
          <h1 style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#fff',
            marginBottom: 16,
            letterSpacing: -0.5
          }}>
            Utku Acikgoz
          </h1>
          <p style={{
            fontSize: 24,
            color: '#FF0080',
            marginBottom: 8,
            fontWeight: 700
          }}>
            Senior Technical Product Manager
          </p>
          <p style={{
            fontSize: 18,
            color: '#00FFFF',
            fontWeight: 500
          }}>
            FINTECH • COMPLIANCE • AI-DRIVEN GROWTH
          </p>

          {/* Contact links */}
          <div style={{
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
            marginTop: 32,
            className: 'contact-links'
          }}>
            <ContactLink href="mailto:hello@utkuacikgoz.com" color="#FFD700">EMAIL</ContactLink>
            <ContactLink href="https://linkedin.com/in/utkuacikgoz" color="#FF0080">LINKEDIN</ContactLink>
            <ContactLink href="https://utkuacikgoz.com" color="#00FFFF">WEBSITE</ContactLink>
          </div>
        </header>

        {/* Case study cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 40,
          marginTop: 80,
          className: 'case-card-grid'
        }}>
          <CaseCard
            title="BILIRA"
            subtitle="Technical Product Management"
            color="#FF0080"
            shape="circle"
            onClick={() => handleCardClick('bilira')}
            isSelected={selectedCard === 'bilira'}
            delay={0}
          />
          <CaseCard
            title="UPSHIFT"
            subtitle="Builder PM"
            color="#00FFFF"
            shape="triangle"
            onClick={() => handleCardClick('upshift')}
            isSelected={selectedCard === 'upshift'}
            delay={1}
          />
          <CaseCard
            title="MESTORES"
            subtitle="0→1 Digital Transformation"
            color="#FFD700"
            shape="square"
            onClick={() => handleCardClick('mestores')}
            isSelected={selectedCard === 'mestores'}
            delay={2}
          />
        </div>
      </div>

      {/* Grid overlay */}
      <GridOverlay />

      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardExit {
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        @keyframes gridPulse {
          0%, 100% {
            opacity: 0.03;
          }
          50% {
            opacity: 0.08;
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 48px !important;
          }
          
          .case-card-grid {
            gap: 24px !important;
          }

          .contact-links {
            gap: 12px !important;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 36px !important;
            letter-spacing: -0.5px !important;
          }

          p {
            font-size: 16px !important;
          }

          .contact-link {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }

          .case-card {
            padding: 24px !important;
          }

          .case-card h2 {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

function VortexAnimation() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      zIndex: 1000
    }}>
      <div style={{
        width: 200,
        height: 200,
        border: '4px solid #FF0080',
        borderRadius: '50%',
        animation: 'vortex 2s ease-out forwards'
      }} />
      <style>{`
        @keyframes vortex {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          100% { transform: scale(10) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ContactLink({ href, children, color }: { href: string; children: string; color: string }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener' : undefined}
      onMouseEnter={() => setIsHovered(true)}
      className="contact-link"
      onMouseLeave={() => setIsHovered(false)}
      style={{
        color: isHovered ? '#000' : color,
        fontSize: 14,
        fontWeight: 700,
        textDecoration: 'none',
        padding: '8px 16px',
        border: `2px solid ${color}`,
        background: isHovered ? color : 'transparent',
        transition: 'all 0.2s',
        display: 'inline-block'
      }}
    >
      {children}
    </a>
  );
}
function CaseCard({ title, subtitle, color, shape, onClick, isSelected, delay }: {
  title: string;
  subtitle: string;
  color: string;
  shape: 'circle' | 'triangle' | 'square';
  onClick: () => void;
  isSelected: boolean;
  delay: number;
}) {
  return (
    <div
      className="case-card"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        padding: 40,
        background: '#0a0a0a',
        border: `3px solid ${color}`,
        position: 'relative',
        transition: 'transform 0.3s, box-shadow 0.3s',
        textAlign: 'center',
        animation: `slideInUp 0.6s ease ${0.4 + delay * 0.1}s both${isSelected ? ', cardExit 0.3s ease forwards' : ''}`,
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = `0 8px 32px ${color}40`;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Shape icon */}
      <div style={{ marginBottom: 24 }}>
        <Shape type={shape} color={color} />
      </div>

      <h2 style={{
        fontSize: 32,
        fontWeight: 900,
        color: '#fff',
        marginBottom: 8,
        letterSpacing: 1
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 14,
        color: color,
        fontWeight: 600
      }}>
        {subtitle}
      </p>
    </div>
  );
}

function Shape({ type, color }: { type: 'circle' | 'triangle' | 'square'; color: string }) {
  const size = 60;

  if (type === 'circle') {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        margin: '0 auto'
      }} />
    );
  }

  if (type === 'triangle') {
    return (
      <div style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
        margin: '0 auto'
      }} />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      background: color,
      margin: '0 auto'
    }} />
  );
}

function GridOverlay() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      pointerEvents: 'none',
      zIndex: 0,
      animation: 'gridPulse 4s ease-in-out infinite'
    }} />
  );
}