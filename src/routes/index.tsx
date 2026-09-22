import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, X } from "lucide-react";
import { useState, type ReactNode } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Pre-Elections — Choose Your Voice" },
      { name: "description", content: "An interactive student pre-election campaign experience." },
      { property: "og:title", content: "Student Pre-Elections" },
      { property: "og:description", content: "Two choices. One voice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ElectionExperience,
});

type Stage = "opening" | "boy" | "boy-detail" | "boy-confirmed" | "girl" | "girl-detail" | "girl-confirmed" | "final";
type Reaction = "correct" | "wrong" | null;

const assets = {
  crocodile: "/campaign/crocodile.png",
  football: "/campaign/football.png",
  globe: "/campaign/globe.png",
  peacock: "/campaign/peacock.png",
  dove: "/campaign/dove.png",
};

function playSound(kind: "wrong" | "correct" | "confirm") {
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.13 : 0.1, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "wrong" ? 0.24 : 0.48));
    const notes = kind === "wrong" ? [170, 125] : kind === "confirm" ? [440, 660, 880] : [523, 659, 784];
    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = kind === "wrong" ? "sawtooth" : "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      const start = ctx.currentTime + index * (kind === "wrong" ? 0.07 : 0.1);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
    window.setTimeout(() => void ctx.close(), 700);
  } catch {
    // The full visual response remains available when a browser blocks audio.
  }
}

function CampaignButton({ children, onClick, secondary = false }: { children: ReactNode; onClick: () => void; secondary?: boolean }) {
  return (
    <button className={secondary ? "campaign-button campaign-button-secondary" : "campaign-button"} onClick={onClick} type="button">
      <span>{children}</span><ChevronRight aria-hidden="true" size={21} strokeWidth={2.2} />
    </button>
  );
}

function ImageMark({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="image-fallback" role="img" aria-label={alt}>{fallback}</span>;
  return <img className="candidate-image" src={src} alt={alt} onError={() => setFailed(true)} draggable={false} />;
}

type CandidateProps = { name: string; label: string; image: string; fallback?: string; preferred?: boolean; onClick: () => void };

function CandidateCard({ name, label, image, fallback = "★", preferred, onClick }: CandidateProps) {
  return (
    <button className={`candidate-card${preferred ? " candidate-card-preferred" : ""}`} onClick={onClick} type="button">
      {preferred && <span className="preferred-pill">Campaign pick</span>}
      <div className="candidate-visual">
        <ImageMark src={image} alt={`${label} symbol`} fallback={fallback} />
      </div>
      <div className="candidate-copy">
        <span className="candidate-label">{label}</span>
        <strong>{name}</strong>
      </div>
      <span className="tap-indicator"><ChevronRight size={20} aria-hidden="true" /></span>
    </button>
  );
}

function Progress({ current }: { current: 1 | 2 }) {
  return <div className="progress" aria-label={`Stage ${current} of 2`}><span className="progress-active" /><span className={current === 2 ? "progress-active" : ""} /></div>;
}

function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>;
}

function ReactionScreen({ correct, kind, onBack, onChoose }: { correct: boolean; kind: "boy" | "girl"; onBack: () => void; onChoose: () => void }) {
  const isBoy = kind === "boy";
  const choice = isBoy ? "Crocodile" : "Peacock";
  return (
    <section className={`reaction-screen ${correct ? "reaction-correct" : "reaction-wrong"}`}>
      {correct ? <Confetti /> : <div className="red-flash" />}
      <div className={`reaction-icon ${correct ? "check-burst" : "x-impact"}`}>
        {correct ? <Check size={82} strokeWidth={2.5} /> : <X size={92} strokeWidth={2.8} />}
      </div>
      {correct && <div className="focus-mark"><ImageMark src={isBoy ? assets.crocodile : assets.peacock} alt={`${choice} symbol`} fallback={isBoy ? "🐊" : "🦚"} /></div>}
      <p className="eyebrow">{correct ? `${choice} energy detected` : "Plot twist"}</p>
      <h1>{correct ? "Excellent choice." : "Not so fast."}</h1>
      <p className="reaction-lead">{correct ? `${choice} selected` : isBoy ? "Interesting choice… but the Crocodile department has submitted a very enthusiastic counterargument." : "A bold tap. The Peacock campaign has requested one tiny, very sparkly reconsideration."}</p>
      {correct ? <CampaignButton onClick={onChoose}>Choose {choice}</CampaignButton> : <CampaignButton onClick={onBack} secondary>Back</CampaignButton>}
    </section>
  );
}

function ConfirmedScreen({ kind, onContinue }: { kind: "boy" | "girl"; onContinue: () => void }) {
  const choice = kind === "boy" ? "Crocodile" : "Peacock";
  return (
    <section className="confirmed-screen">
      <div className="confirmed-ring"><Check size={54} strokeWidth={2.5} /></div>
      <p className="eyebrow">Choice locked in</p>
      <h1>{choice} confirmed.</h1>
      <p>That was smooth. Ready for the next level?</p>
      <CampaignButton onClick={onContinue}>Continue</CampaignButton>
    </section>
  );
}

function SelectionScreen({ kind, choose }: { kind: "boy" | "girl"; choose: (correct: boolean) => void }) {
  const isBoy = kind === "boy";
  return (
    <section className="selection-screen">
      <header className="stage-header">
        <Progress current={isBoy ? 1 : 2} />
        <p className="eyebrow">Stage {isBoy ? "one" : "two"}</p>
        <h1>{isBoy ? "Boy" : "Girl"} Vice President</h1>
        <p>Choose your candidate.</p>
      </header>
      <div className={`candidate-grid ${isBoy ? "three-up" : "two-up"}`}>
        {isBoy ? <>
          <CandidateCard name="Muhammad Fasih Ur Rehman" label="Crocodile" preferred image={assets.crocodile} fallback="🐊" onClick={() => choose(true)} />
          <CandidateCard name="Abu Bakr" label="Football" image={assets.football} fallback="⚽" onClick={() => choose(false)} />
          <CandidateCard name="Muhammad Qamar" label="Globe" image={assets.globe} fallback="🌍" onClick={() => choose(false)} />
        </> : <>
          <CandidateCard name="Azla" label="Peacock" preferred image={assets.peacock} fallback="🦚" onClick={() => choose(true)} />
          <CandidateCard name="Minaal" label="Dove" image={assets.dove} fallback="🕊️" onClick={() => choose(false)} />
        </>}
      </div>
    </section>
  );
}

function FinalScreen() {
  return (
    <section className="final-screen">
      <Confetti />
      <p className="eyebrow">Pre-elections complete</p>
      <h1>Your choices<br />have been made.</h1>
      <div className="final-choices">
        <div className="final-choice"><ImageMark src={assets.crocodile} alt="Crocodile symbol" fallback="🐊" /><div><span>Crocodile</span><strong>Muhammad Fasih Ur Rehman</strong></div><Check size={26} /></div>
        <div className="final-choice"><ImageMark src={assets.peacock} alt="Peacock symbol" fallback="🦚" /><div><span>Peacock</span><strong>Azla</strong></div><Check size={26} /></div>
      </div>
      <p className="closing-line">Two strong choices. One brilliantly stylish finish.</p>
      <CampaignButton onClick={() => { playSound("confirm"); }}>Done</CampaignButton>
    </section>
  );
}

function ElectionExperience() {
  const [stage, setStage] = useState<Stage>("opening");
  const [reaction, setReaction] = useState<Reaction>(null);

  const choose = (kind: "boy" | "girl", correct: boolean) => {
    setReaction(correct ? "correct" : "wrong");
    playSound(correct ? "correct" : "wrong");
    setStage(kind === "boy" ? "boy-detail" : "girl-detail");
  };

  return (
    <main className="election-app">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <div className="brand-mark"><span>SP</span><small>2026</small></div>
      {stage === "opening" && <section className="opening-screen">
        <div className="opening-symbols" aria-hidden="true"><span>🐊</span><i /><span>🦚</span></div>
        <p className="eyebrow">The campaign experience</p>
        <h1>Student<br />Pre-Elections</h1>
        <p className="opening-subtitle">Two choices. One voice.</p>
        <CampaignButton onClick={() => { playSound("confirm"); setStage("boy"); }}>Begin</CampaignButton>
      </section>}
      {stage === "boy" && <SelectionScreen kind="boy" choose={(correct) => choose("boy", correct)} />}
      {stage === "boy-detail" && <ReactionScreen correct={reaction === "correct"} kind="boy" onBack={() => { setReaction(null); setStage("boy"); }} onChoose={() => { playSound("confirm"); setStage("boy-confirmed"); }} />}
      {stage === "boy-confirmed" && <ConfirmedScreen kind="boy" onContinue={() => setStage("girl")} />}
      {stage === "girl" && <SelectionScreen kind="girl" choose={(correct) => choose("girl", correct)} />}
      {stage === "girl-detail" && <ReactionScreen correct={reaction === "correct"} kind="girl" onBack={() => { setReaction(null); setStage("girl"); }} onChoose={() => { playSound("confirm"); setStage("girl-confirmed"); }} />}
      {stage === "girl-confirmed" && <ConfirmedScreen kind="girl" onContinue={() => { playSound("correct"); setStage("final"); }} />}
      {stage === "final" && <FinalScreen />}
    </main>
  );
}