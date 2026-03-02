import React from 'react';
import { Piece as PieceType } from '@/game/checkersEngine';
import { Crown, Shield, Flame, Skull, Star, Gem, Snowflake, Sword, Heart, Zap, Eye, Moon, Sun, Hexagon, Sparkles, Diamond, CircleDot, Target, Anchor, Bug, Ghost, Trophy } from 'lucide-react';
import { PieceSet } from './SelectionPage';

interface GamePieceProps {
  piece: PieceType;
  isSelected: boolean;
  onClick: () => void;
  pieceSet?: PieceSet;
  isAnimating?: boolean;
  animationType?: 'move' | 'capture' | 'promotion';
  colorOverrides?: {
    p1Color: string | null;
    p1Glow: string | null;
    p2Color: string | null;
    p2Glow: string | null;
  };
  sprites?: {
    p1Normal?: string;
    p1King?: string;
    p2Normal?: string;
    p2King?: string;
  };
}

type IconConfig = {
  goldNormal: React.ReactNode;
  goldKing: React.ReactNode;
  crimsonNormal: React.ReactNode;
  crimsonKing: React.ReactNode;
};

const iconSize = "w-5 h-5 sm:w-6 sm:h-6 drop-shadow-lg";
const kingSize = "w-6 h-6 sm:w-7 sm:h-7 drop-shadow-lg";

const pieceSetIcons: Record<PieceSet, IconConfig> = {
  'classic-gold': {
    goldNormal: <Shield className={iconSize} />,
    goldKing: <Crown className={kingSize} />,
    crimsonNormal: <Flame className={iconSize} />,
    crimsonKing: <Skull className={kingSize} />,
  },
  'celestial-blue': {
    goldNormal: <Star className={iconSize} />,
    goldKing: <Sun className={kingSize} />,
    crimsonNormal: <Moon className={iconSize} />,
    crimsonKing: <Eye className={kingSize} />,
  },
  'emerald-magic': {
    goldNormal: <Gem className={iconSize} />,
    goldKing: <Diamond className={kingSize} />,
    crimsonNormal: <Hexagon className={iconSize} />,
    crimsonKing: <Bug className={kingSize} />,
  },
  'infernal-red': {
    goldNormal: <Zap className={iconSize} />,
    goldKing: <Sword className={kingSize} />,
    crimsonNormal: <Snowflake className={iconSize} />,
    crimsonKing: <Anchor className={kingSize} />,
  },
  'obsidian-shadow': {
    goldNormal: <Ghost className={iconSize} />,
    goldKing: <Skull className={kingSize} />,
    crimsonNormal: <Zap className={iconSize} />,
    crimsonKing: <Skull className={kingSize} />,
  },
  'jade-aurora': {
    goldNormal: <Hexagon className={iconSize} />,
    goldKing: <Zap className={kingSize} />,
    crimsonNormal: <Diamond className={iconSize} />,
    crimsonKing: <Sparkles className={kingSize} />,
  },
  'titanic-relic': {
    goldNormal: <Shield className={iconSize} />,
    goldKing: <Crown className={kingSize} />,
    crimsonNormal: <Anchor className={iconSize} />,
    crimsonKing: <Trophy className={kingSize} />,
  },
  'infinite-nebula': {
    goldNormal: <Moon className={iconSize} />,
    goldKing: <Sun className={kingSize} />,
    crimsonNormal: <Star className={iconSize} />,
    crimsonKing: <Sparkles className={kingSize} />,
  },
  'dragon-legion': {
    goldNormal: <Sword className={iconSize} />,
    goldKing: <Crown className={kingSize} />,
    crimsonNormal: <Skull className={iconSize} />,
    crimsonKing: <Flame className={kingSize} />,
  },
};

const GamePiece: React.FC<GamePieceProps> = ({ piece, isSelected, onClick, pieceSet = 'classic-gold', isAnimating, animationType, colorOverrides, sprites }) => {
  const isGold = piece.player === 'gold';
  const isKing = piece.type === 'king';

  // Apply overrides if available
  const customColor = isGold ? colorOverrides?.p1Color : colorOverrides?.p2Color;
  const customGlow = isGold ? colorOverrides?.p1Glow : colorOverrides?.p2Glow;

  const icons = pieceSetIcons[pieceSet];
  const icon = isGold
    ? (isKing ? icons.goldKing : icons.goldNormal)
    : (isKing ? icons.crimsonKing : icons.crimsonNormal);

  const sprite = isGold
    ? (isKing ? sprites?.p1King : sprites?.p1Normal)
    : (isKing ? sprites?.p2King : sprites?.p2Normal);

  return (
    <button
      onClick={onClick}
      className={`
        relative w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer
        transition-all duration-300 ease-out
        ${isGold ? 'piece-enamel-gold' : 'piece-enamel-crimson'}
        ${isSelected ? 'scale-110 z-10' : 'hover:scale-105'}
        ${isKing ? (isGold ? 'piece-king-aura-gold' : 'piece-king-aura-crimson') : ''}
        ${isAnimating && animationType === 'capture' ? 'animate-scale-in' : ''}
      `}
      style={{
        boxShadow: customColor && customGlow
          ? `0 4px 0 ${customColor}99, 0 6px 10px rgba(0,0,0,0.4), 0 0 20px ${customGlow}40`
          : (isGold
            ? '0 4px 0 hsl(35 60% 30%), 0 6px 10px rgba(0,0,0,0.4)'
            : '0 4px 0 hsl(0 50% 25%), 0 6px 10px rgba(0,0,0,0.4)'),
        background: customColor && customGlow
          ? `radial-gradient(ellipse at 35% 25%, ${customGlow}99 0%, transparent 40%), linear-gradient(160deg, ${customGlow}, ${customColor} 35%, ${customColor}aa 100%)`
          : undefined,
      }}
    >
      {/* Glass reflection overlay */}
      <div className="absolute inset-[2px] rounded-full piece-glass pointer-events-none" />

      {/* Inner metallic ring */}
      <div className={`
        absolute inset-[4px] rounded-full pointer-events-none
        ${isGold ? 'piece-ring-gold' : 'piece-ring-crimson'}
      `}
        style={customGlow ? { border: `1.5px solid ${customGlow}80`, boxShadow: `inset 0 0 8px ${customGlow}30` } : {}}
      />

      {/* Shimmer sweep on hover/select */}
      {isSelected && (
        <div className="absolute inset-[2px] rounded-full pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.25) 50%, transparent 100%)',
            }}
          />
        </div>
      )}

      {/* Center icon */}
      <div className={`
        absolute inset-0 flex items-center justify-center
        ${isGold ? 'text-primary-foreground' : 'text-foreground'}
        drop-shadow-sm
        icon-contour-glow
        ${isKing ? (isGold ? 'king-crown-sweep-gold' : 'king-crown-sweep-crimson') : ''}
      `}>
        {sprite ? <img src={sprite} alt="" className="w-full h-full object-contain p-1 opacity-90 brightness-110 drop-shadow-md" /> : icon}
      </div>

      {/* Selection glow ring */}
      {isSelected && (
        <div className={`
          absolute -inset-1.5 rounded-full animate-glow-pulse pointer-events-none
          border-2
          ${isGold ? 'border-gold-glow/60 bg-gold-glow/10' : 'border-crimson-glow/60 bg-crimson-glow/10'}
        `}
          style={customGlow ? { borderColor: `${customGlow}99`, backgroundColor: `${customGlow}20` } : {}}
        />
      )}

      {/* King star badge */}
      {isKing && (
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 pointer-events-none">
          <Sparkles className={`w-3.5 h-3.5 ${isGold ? 'text-gold-glow' : 'text-crimson-glow'} fill-current drop-shadow-lg`} />
        </div>
      )}

      {/* Bottom edge highlight (3D depth) */}
      <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-full pointer-events-none"
        style={{
          background: isGold
            ? 'linear-gradient(90deg, transparent, hsl(var(--gold-glow) / 0.4), transparent)'
            : 'linear-gradient(90deg, transparent, hsl(var(--crimson-glow) / 0.4), transparent)',
        }}
      />
    </button>
  );
};

export default GamePiece;
