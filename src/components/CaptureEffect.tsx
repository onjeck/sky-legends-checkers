import React, { useEffect, useState } from 'react';

export type CaptureEffectType = 'lightning' | 'abduction' | 'ghost' | 'smoke' | 'explosion';

interface CaptureEffectProps {
  row: number;
  col: number;
  effectType: CaptureEffectType;
  onComplete: () => void;
}

const EFFECT_DURATION = 900;

const LightningEffect: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    {/* Central flash */}
    <div className="absolute w-full h-full animate-capture-flash rounded-sm"
      style={{ background: 'radial-gradient(circle, hsl(200 90% 70% / 0.9) 0%, hsl(220 80% 50% / 0.4) 40%, transparent 70%)' }}
    />
    {/* Lightning bolts */}
    <svg className="absolute w-full h-full animate-capture-bolt" viewBox="0 0 60 60" fill="none">
      <path d="M30 5 L25 25 L35 22 L20 55" stroke="hsl(200, 95%, 75%)" strokeWidth="2.5" strokeLinecap="round" 
        filter="drop-shadow(0 0 6px hsl(200 90% 70%))" />
      <path d="M40 8 L35 20 L42 18 L30 45" stroke="hsl(210, 90%, 80%)" strokeWidth="1.5" strokeLinecap="round"
        filter="drop-shadow(0 0 4px hsl(210 85% 75%))" opacity="0.7" />
      <path d="M18 10 L22 22 L16 20 L28 48" stroke="hsl(190, 85%, 70%)" strokeWidth="1.5" strokeLinecap="round"
        filter="drop-shadow(0 0 4px hsl(190 80% 65%))" opacity="0.6" />
    </svg>
    {/* Spark particles */}
    {[...Array(6)].map((_, i) => (
      <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-capture-spark"
        style={{
          background: 'hsl(200 90% 80%)',
          boxShadow: '0 0 6px hsl(200 90% 70%)',
          left: `${20 + Math.random() * 60}%`,
          top: `${20 + Math.random() * 60}%`,
          animationDelay: `${i * 80}ms`,
        }}
      />
    ))}
  </div>
);

const AbductionEffect: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    {/* Beam from above */}
    <div className="absolute w-[80%] h-full animate-capture-beam"
      style={{
        background: 'linear-gradient(180deg, hsl(150 80% 60% / 0.8) 0%, hsl(150 70% 50% / 0.3) 50%, transparent 100%)',
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
      }}
    />
    {/* Rising rings */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="absolute w-10 h-10 rounded-full border-2 animate-capture-ring"
        style={{
          borderColor: `hsl(150 70% 60% / ${0.8 - i * 0.2})`,
          boxShadow: `0 0 8px hsl(150 70% 55% / 0.4)`,
          animationDelay: `${i * 150}ms`,
        }}
      />
    ))}
    {/* Center glow */}
    <div className="absolute w-6 h-6 rounded-full animate-capture-abduct-glow"
      style={{ background: 'radial-gradient(circle, hsl(150 80% 70% / 0.9), transparent)', boxShadow: '0 0 20px hsl(150 80% 60% / 0.6)' }}
    />
  </div>
);

const GhostEffect: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    {/* Ghost silhouette rising */}
    <div className="absolute animate-capture-ghost-rise">
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none">
        <path d="M18 4C10 4 4 10 4 18V34C4 34 8 30 12 34C16 38 20 30 24 34C28 38 32 34 32 34V18C32 10 26 4 18 4Z"
          fill="hsl(220 20% 80% / 0.6)" filter="drop-shadow(0 0 8px hsl(220 30% 70% / 0.5))" />
        <circle cx="13" cy="18" r="2.5" fill="hsl(220 40% 30% / 0.7)" />
        <circle cx="23" cy="18" r="2.5" fill="hsl(220 40% 30% / 0.7)" />
        <ellipse cx="18" cy="26" rx="3" ry="2" fill="hsl(220 30% 40% / 0.5)" />
      </svg>
    </div>
    {/* Wispy trails */}
    {[...Array(4)].map((_, i) => (
      <div key={i} className="absolute w-2 h-8 rounded-full animate-capture-wisp"
        style={{
          background: `linear-gradient(180deg, hsl(220 20% 80% / ${0.5 - i * 0.1}), transparent)`,
          left: `${25 + i * 15}%`,
          animationDelay: `${i * 100}ms`,
        }}
      />
    ))}
  </div>
);

const SmokeEffect: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    {/* Smoke puffs */}
    {[...Array(5)].map((_, i) => (
      <div key={i} className="absolute rounded-full animate-capture-smoke"
        style={{
          width: `${14 + Math.random() * 12}px`,
          height: `${14 + Math.random() * 12}px`,
          background: `radial-gradient(circle, hsl(0 0% 60% / ${0.6 - i * 0.08}), hsl(0 0% 40% / 0.2), transparent)`,
          left: `${30 + (Math.random() - 0.5) * 40}%`,
          top: `${30 + (Math.random() - 0.5) * 40}%`,
          animationDelay: `${i * 100}ms`,
          filter: 'blur(2px)',
        }}
      />
    ))}
  </div>
);

const ExplosionEffect: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
    {/* Core flash */}
    <div className="absolute w-full h-full animate-capture-flash rounded-sm"
      style={{ background: 'radial-gradient(circle, hsl(30 100% 60% / 0.9) 0%, hsl(0 80% 50% / 0.5) 35%, transparent 65%)' }}
    />
    {/* Shrapnel particles */}
    {[...Array(8)].map((_, i) => {
      const angle = (i / 8) * 360;
      return (
        <div key={i} className="absolute w-2 h-2 rounded-full animate-capture-shrapnel"
          style={{
            background: i % 2 === 0 ? 'hsl(40 90% 60%)' : 'hsl(0 80% 55%)',
            boxShadow: `0 0 4px ${i % 2 === 0 ? 'hsl(40 90% 60%)' : 'hsl(0 80% 55%)'}`,
            '--shrapnel-x': `${Math.cos(angle * Math.PI / 180) * 30}px`,
            '--shrapnel-y': `${Math.sin(angle * Math.PI / 180) * 30}px`,
          } as React.CSSProperties}
        />
      );
    })}
    {/* Shockwave ring */}
    <div className="absolute w-4 h-4 rounded-full border-2 border-accent/70 animate-capture-shockwave" />
  </div>
);

const effectComponents: Record<CaptureEffectType, React.FC> = {
  lightning: LightningEffect,
  abduction: AbductionEffect,
  ghost: GhostEffect,
  smoke: SmokeEffect,
  explosion: ExplosionEffect,
};

const CaptureEffect: React.FC<CaptureEffectProps> = ({ effectType, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, EFFECT_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const EffectComponent = effectComponents[effectType];
  return <EffectComponent />;
};

export default CaptureEffect;

export function getRandomEffect(): CaptureEffectType {
  const effects: CaptureEffectType[] = ['lightning', 'abduction', 'ghost', 'smoke', 'explosion'];
  return effects[Math.floor(Math.random() * effects.length)];
}
