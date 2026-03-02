import React, { useState } from 'react';
import { Settings, ArrowLeft, Check, Volume2, VolumeX } from 'lucide-react';

export type RuleSet = 'brazilian' | 'american';

interface RuleInfo {
  key: RuleSet;
  label: string;
  flag: string;
  features: string[];
  description: string;
}

const rules: RuleInfo[] = [
  {
    key: 'brazilian',
    label: 'Damas Brasileiras',
    flag: '🇧🇷',
    description: 'Regras oficiais brasileiras com dama voadora',
    features: [
      'Dama voa em todas as diagonais (múltiplas casas)',
      'Captura obrigatória de maior sequência',
      'Peça normal captura para frente e para trás',
      'Tabuleiro 8×8',
    ],
  },
  {
    key: 'american',
    label: 'Damas Americanas',
    flag: '🇺🇸',
    description: 'Regras clássicas americanas (English Draughts)',
    features: [
      'Dama move apenas 1 casa por vez',
      'Captura obrigatória (qualquer captura válida)',
      'Peça normal captura apenas para frente',
      'Tabuleiro 8×8',
    ],
  },
];

interface SettingsPageProps {
  currentRuleSet: RuleSet;
  soundEnabled: boolean;
  onConfirm: (ruleSet: RuleSet, soundEnabled: boolean) => void;
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ currentRuleSet, soundEnabled: initialSound, onConfirm, onBack }) => {
  const [selected, setSelected] = useState<RuleSet>(currentRuleSet);
  const [sound, setSound] = useState(initialSound);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-gold mb-4">
            <Settings className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-2xl text-foreground text-glow-gold">Configurações</h2>
          <p className="text-sm text-muted-foreground font-body mt-1">Escolha o estilo de regras</p>
        </div>

        {/* Rule cards */}
        <div className="flex flex-col gap-4 mb-8">
          {rules.map((rule) => {
            const isActive = selected === rule.key;
            return (
              <button
                key={rule.key}
                onClick={() => setSelected(rule.key)}
                className={`
                  relative text-left p-5 rounded-2xl border-2 transition-all duration-300
                  ${isActive
                    ? 'border-primary bg-primary/10 box-glow-gold'
                    : 'border-border/30 bg-card/60 backdrop-blur hover:border-border/60'
                  }
                `}
              >
                {/* Selected indicator */}
                {isActive && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full gradient-gold flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{rule.flag}</span>
                  <div>
                    <h3 className="font-display text-base text-foreground">{rule.label}</h3>
                    <p className="text-xs text-muted-foreground font-body">{rule.description}</p>
                  </div>
                </div>

                <ul className="space-y-1.5 ml-1">
                  {rule.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-body text-muted-foreground">
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Sound toggle */}
        <div className="mb-8">
          <button
            onClick={() => setSound(s => !s)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300
              ${sound
                ? 'border-primary bg-primary/10 box-glow-gold'
                : 'border-border/30 bg-card/60 backdrop-blur hover:border-border/60'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {sound ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
              <div className="text-left">
                <h3 className="font-display text-base text-foreground">Efeitos Sonoros</h3>
                <p className="text-xs text-muted-foreground font-body">{sound ? 'Ativados' : 'Desativados'}</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${sound ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-transform duration-300 ${sound ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl bg-secondary/50 text-foreground font-body text-sm hover:bg-secondary/70 transition-colors"
          >
            ← Voltar
          </button>
          <button
            onClick={() => onConfirm(selected, sound)}
            className="flex-1 px-6 py-3 rounded-xl gradient-gold text-primary-foreground font-display text-sm box-glow-gold hover:scale-105 transition-transform"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
