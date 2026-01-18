import { useState } from 'react';
import NarrativeScene from '../components/NarrativeScene';
import MetricsVisualization from '../components/MetricsVisualization';
import SentimentJourney from '../components/SentimentJourney';
import DecisionMatrix from '../components/DecisionMatrix';
import EffortImpactBubbles from '../components/EffortImpactBubbles';
import StakeholderNetwork from '../components/StakeholderNetwork';
import CTASection from '../components/CTASection';
import Logo from '../components/Logo';

type CaseStudy = {
  id: string;
  title: string;
  sentimentScores?: number[]; // Optional custom sentiment ratios per case study
  beats: Array<{
    id: string;
    body: string[];
    metrics?: Array<{
      label: string;
      before: number;
      after: number;
      unit: string;
      color: string;
    }>;
    decisions?: Array<{
      label: string;
      speed: number;
      risk: number;
      isChosen: boolean;
      color: string;
    }>;
    initiatives?: Array<{
      label: string;
      effort: number;
      impact: number;
      timeToValue: number;
      color: string;
    }>;
    stakeholders?: Array<{
      name: string;
      role: string;
      color: string;
    }>;
  }>;
};

type Props = {
  caseStudy: CaseStudy;
  onBack: () => void;
};

const SECTION_LABELS = ['Problem', 'Constraints', 'Approach', 'Results', 'Learnings'];
const COLORS = ['#FF0080', '#00FFFF', '#FFD700', '#FF6B35', '#00FF00'];

export default function CaseStudyPage({ caseStudy, onBack }: Props) {
  const [activeSection, setActiveSection] = useState(0);

  const handleSectionChange = (newSection: number) => {
    setActiveSection(newSection);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate sentiment scores dynamically based on visualization data
  const calculateSentimentScores = () => {
    // Use custom sentiment scores if provided, otherwise calculate
    if (caseStudy.sentimentScores) {
      return caseStudy.sentimentScores;
    }

    return caseStudy.beats.map((beat, index) => {
      // Base sentiment increases through beats
      let sentiment = (index + 1) * 15;
      
      // Boost if this beat has rich visualization data
      if (beat.stakeholders) sentiment += 10;
      if (beat.decisions) sentiment += 10;
      if (beat.initiatives) sentiment += 10;
      if (beat.metrics) sentiment += 10;
      
      return Math.min(100, sentiment);
    });
  };

  const sentimentScores = calculateSentimentScores();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      position: 'relative'
    }}>
      {/* Logo */}
      <Logo onClick={onBack} />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          padding: '12px 24px',
          background: 'transparent',
          border: '2px solid #fff',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 700,
          zIndex: 100,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.color = '#000';
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#fff';
        }}
      >
        ← BACK
      </button>

      {/* Title */}
      <div style={{
        textAlign: 'center',
        padding: '60px 24px 40px',
        '@media (max-width: 768px)': {
          padding: '40px 16px 24px'
        }
      }}>
        <h1 style={{
          fontSize: 48,
          fontWeight: 900,
          textTransform: 'none',
          letterSpacing: -0.5
        }}>
          {caseStudy.title.split('—')[0].trim()}
        </h1>
        <p style={{
          fontSize: 20,
          color: COLORS[activeSection],
          marginTop: 8,
          fontWeight: 600
        }}>
          {caseStudy.title.split('—')[1]?.trim()}
        </p>
      </div>

      {/* Navigation dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 60,
        flexWrap: 'wrap',
        paddingX: 24
      }}>
        {caseStudy.beats.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSectionChange(index)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}
          >
            <div style={{
              width: activeSection === index ? 20 : 16,
              height: activeSection === index ? 20 : 16,
              background: activeSection >= index ? COLORS[index] : '#333',
              borderRadius: '50%',
              transition: 'all 0.3s',
              border: activeSection === index ? `3px solid ${COLORS[index]}` : 'none',
              boxShadow: activeSection === index ? `0 0 20px ${COLORS[index]}` : 'none'
            }} />
            <span style={{
              fontSize: 10,
              color: activeSection >= index ? COLORS[index] : '#666',
              fontWeight: 700
            }}>
              {SECTION_LABELS[index]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '0 24px 100px'
      }}>
        {/* Sentiment Journey - Overview of the emotional arc */}
        <SentimentJourney
          currentSection={activeSection}
          sectionColor={COLORS[activeSection]}
          sectionLabels={SECTION_LABELS}
          sentimentScores={sentimentScores}
        />

        {/* Narrative 3D Scene */}
        <div style={{ marginBottom: 60 }}>
          <NarrativeScene
            section={activeSection}
            color={COLORS[activeSection]}
          />
        </div>

        {/* Metrics visualization (when available) */}
        {caseStudy.beats[activeSection]?.metrics && (
          <div style={{ marginBottom: 60 }}>
            <MetricsVisualization
              metrics={caseStudy.beats[activeSection].metrics}
              sectionColor={COLORS[activeSection]}
            />
          </div>
        )}

        {/* Decision Matrix (when available) */}
        {caseStudy.beats[activeSection]?.decisions && (
          <div style={{ marginBottom: 60 }}>
            <DecisionMatrix
              decisions={caseStudy.beats[activeSection].decisions}
              sectionColor={COLORS[activeSection]}
            />
          </div>
        )}

        {/* Effort vs Impact (when available) */}
        {caseStudy.beats[activeSection]?.initiatives && (
          <div style={{ marginBottom: 60 }}>
            <EffortImpactBubbles
              initiatives={caseStudy.beats[activeSection].initiatives}
              sectionColor={COLORS[activeSection]}
            />
          </div>
        )}

        {/* Stakeholder Network (when available) */}
        {caseStudy.beats[activeSection]?.stakeholders && (
          <div style={{ marginBottom: 60 }}>
            <StakeholderNetwork
              stakeholders={caseStudy.beats[activeSection].stakeholders}
              sectionColor={COLORS[activeSection]}
            />
          </div>
        )}

        <div style={{
          background: '#0a0a0a',
          border: `3px solid ${COLORS[activeSection]}`,
          padding: '60px',
          minHeight: 300,
          marginBottom: 60
        }}>
          <h2 style={{
            fontSize: 32,
            fontWeight: 900,
            color: COLORS[activeSection],
            marginBottom: 32,
            letterSpacing: 0.5
          }}>
            {SECTION_LABELS[activeSection]}
          </h2>

          {caseStudy.beats[activeSection].body.map((text, i) => (
            <p key={i} style={{
              fontSize: 18,
              lineHeight: 1.8,
              marginBottom: 24,
              color: '#e0e0e0'
            }}>
              {text}
            </p>
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          marginTop: 40,
          marginBottom: 80
        }}>
          <button
            onClick={() => handleSectionChange(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              border: `2px solid ${activeSection === 0 ? '#333' : COLORS[activeSection]}`,
              color: activeSection === 0 ? '#333' : COLORS[activeSection],
              cursor: activeSection === 0 ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              flex: 1
            }}
          >
            ← PREVIOUS BEAT
          </button>

          <button
            onClick={() => handleSectionChange(Math.min(caseStudy.beats.length - 1, activeSection + 1))}
            disabled={activeSection === caseStudy.beats.length - 1}
            style={{
              padding: '12px 32px',
              background: 'transparent',
              border: `2px solid ${activeSection === caseStudy.beats.length - 1 ? '#333' : COLORS[activeSection]}`,
              color: activeSection === caseStudy.beats.length - 1 ? '#333' : COLORS[activeSection],
              cursor: activeSection === caseStudy.beats.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              flex: 1
            }}
          >
            NEXT BEAT →
          </button>
        </div>
      </div>

      {/* CTA Hook - appears after case study */}
      {activeSection === caseStudy.beats.length - 1 && (
        <CTASection color={COLORS[4]} />
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '3px solid #333',
        padding: '60px 24px',
        textAlign: 'center',
        background: '#0a0a0a'
      }}>
        <p style={{
          fontSize: 14,
          color: '#666',
          marginBottom: 24
        }}>
          © 2026 Utku Acikgoz • Senior Technical Product Manager
        </p>
        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center'
        }}>
          <a href="mailto:hello@utkuacikgoz.com" style={{
            color: '#888',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#FF0080'}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#888'}
          >
            EMAIL
          </a>
          <a href="https://linkedin.com/in/utkuacikgoz" target="_blank" rel="noopener" style={{
            color: '#888',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#00FFFF'}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#888'}
          >
            LINKEDIN
          </a>
          <a href="https://utkuacikgoz.com" target="_blank" rel="noopener" style={{
            color: '#888',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#FFD700'}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = '#888'}
          >
            WEBSITE
          </a>
        </div>
      </footer>

      {/* Grid overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0
      }} />
    </div>
  );
}