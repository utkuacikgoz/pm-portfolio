import { useCaseStudy } from "../content/useCaseStudy";

export default function Proof() {
  const { caseStudy } = useCaseStudy();
  const beat = caseStudy.beats.find(b => b.id === "proof");
  if (!beat) return null;

  return (
    <div>
      <h3 style={{ fontSize: 28, marginBottom: 24, opacity: 0.5, fontWeight: 400 }}>
        Key Learnings
      </h3>
      {beat.body.map((line, i) => (
        <p key={i} style={{ fontSize: 18, lineHeight: 1.8, opacity: 0.9, marginBottom: 16 }}>
          {line}
        </p>
      ))}
    </div>
  );
}