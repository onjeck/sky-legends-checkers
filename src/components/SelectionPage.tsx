import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Crown, Shield, Flame, Skull, Star, Gem, Sparkles, Eye, Zap, Moon, Sun, Diamond, Hexagon, Snowflake, Sword, CircleDot, Target, Heart, Anchor, Bug, Palette, Lock, Coins, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BoardTheme = 'golden-clouds' | 'sunset-sky' | 'celestial-night' | 'divine-storm' | 'arcade-paradise';
export type PieceSet = 'classic-gold' | 'celestial-blue' | 'emerald-magic' | 'infernal-red' | 'obsidian-shadow' | 'jade-aurora' | 'titanic-relic' | 'infinite-nebula' | 'dragon-legion';

interface SelectionPageProps {
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  onConfirm: (board: BoardTheme, pieces: PieceSet) => void;
  onBack: () => void;
}

const boardThemes: { key: BoardTheme; name: string; desc: string; colors: [string, string, string]; icon: React.ReactNode }[] = [
  { key: 'golden-clouds', name: 'Nuvens Douradas', desc: 'Ensolarado e nostálgico', colors: ['hsl(40 85% 55%)', 'hsl(35 30% 65%)', 'hsl(225 30% 15%)'], icon: <Star className="w-4 h-4" /> },
  { key: 'sunset-sky', name: 'Céu do Pôr do Sol', desc: 'Laranja e roxo épico', colors: ['hsl(20 90% 55%)', 'hsl(35 40% 60%)', 'hsl(280 30% 18%)'], icon: <Sparkles className="w-4 h-4" /> },
  { key: 'celestial-night', name: 'Reino Celestial', desc: 'Noite, estrelas e magia', colors: ['hsl(220 60% 45%)', 'hsl(240 20% 40%)', 'hsl(240 40% 10%)'], icon: <Eye className="w-4 h-4" /> },
  { key: 'divine-storm', name: 'Tempestade Divina', desc: 'Nuvens escuras e raios', colors: ['hsl(200 30% 35%)', 'hsl(220 15% 30%)', 'hsl(220 25% 8%)'], icon: <Zap className="w-4 h-4" /> },
  { key: 'arcade-paradise', name: 'Paraíso Arcade', desc: 'Cores vibrantes retrô', colors: ['hsl(320 70% 55%)', 'hsl(180 60% 50%)', 'hsl(260 40% 15%)'], icon: <Gem className="w-4 h-4" /> },
];

export const pieceSets: {
  key: PieceSet;
  name: string;
  desc: string;
  price: number;
  rarity: string;
  p1Color: string;
  p2Color: string;
  p1Glow: string;
  p2Glow: string;
  sprites?: {
    p1Normal?: string;
    p1King?: string;
    p2Normal?: string;
    p2King?: string;
  };
  icons: {
    p1Normal: React.ReactNode;
    p1King: React.ReactNode;
    p2Normal: React.ReactNode;
    p2King: React.ReactNode
  }
}[] = [
    { key: 'classic-gold', name: 'Ouro Clássico', desc: 'Brilho original', price: 0, rarity: 'Comum', p1Color: 'hsl(40 85% 55%)', p2Color: 'hsl(0 75% 45%)', p1Glow: 'hsl(40 90% 65%)', p2Glow: 'hsl(0 80% 55%)', icons: { p1Normal: <Shield className="w-4 h-4" />, p1King: <Crown className="w-5 h-5" />, p2Normal: <Flame className="w-4 h-4" />, p2King: <Skull className="w-5 h-5" /> } },
    { key: 'celestial-blue', name: 'Azul Celestial', desc: 'Fragmentos do céu', price: 500, rarity: 'Raro', p1Color: 'hsl(220 60% 50%)', p2Color: 'hsl(280 60% 45%)', p1Glow: 'hsl(210 80% 65%)', p2Glow: 'hsl(280 70% 60%)', icons: { p1Normal: <Star className="w-4 h-4" />, p1King: <Sun className="w-5 h-5" />, p2Normal: <Moon className="w-4 h-4" />, p2King: <Eye className="w-5 h-5" /> } },
    { key: 'emerald-magic', name: 'Esmeralda Mágica', desc: 'Energia da floresta', price: 1200, rarity: 'Épico', p1Color: 'hsl(150 60% 40%)', p2Color: 'hsl(350 70% 50%)', p1Glow: 'hsl(150 70% 55%)', p2Glow: 'hsl(350 80% 60%)', icons: { p1Normal: <Gem className="w-4 h-4" />, p1King: <Diamond className="w-5 h-5" />, p2Normal: <Hexagon className="w-4 h-4" />, p2King: <Bug className="w-5 h-5" /> } },
    { key: 'infernal-red', name: 'Vermelho Infernal', desc: 'Rastro de cometa', price: 2500, rarity: 'Épico', p1Color: 'hsl(15 90% 50%)', p2Color: 'hsl(195 70% 50%)', p1Glow: 'hsl(15 95% 60%)', p2Glow: 'hsl(195 80% 65%)', icons: { p1Normal: <Zap className="w-4 h-4" />, p1King: <Sword className="w-5 h-5" />, p2Normal: <Snowflake className="w-4 h-4" />, p2King: <Anchor className="w-5 h-5" /> } },
    { key: 'obsidian-shadow', name: 'Obsidiano Sombrio', desc: 'Escuridão total', price: 5000, rarity: 'Lendário', p1Color: 'hsl(220 10% 70%)', p2Color: 'hsl(0 0% 15%)', p1Glow: 'hsl(220 15% 85%)', p2Glow: 'hsl(270 50% 40%)', icons: { p1Normal: <CircleDot className="w-4 h-4" />, p1King: <Target className="w-5 h-5" />, p2Normal: <Heart className="w-4 h-4" />, p2King: <Sparkles className="w-5 h-5" /> } },
    { key: 'jade-aurora', name: 'Aurora de Jade', desc: 'Energia neo-celestial', price: 3500, rarity: 'Épico', p1Color: 'hsl(150 90% 40%)', p2Color: 'hsl(280 80% 30%)', p1Glow: 'hsl(150 100% 60%)', p2Glow: 'hsl(280 100% 60%)', icons: { p1Normal: <Hexagon className="w-4 h-4" />, p1King: <Zap className="w-5 h-5" />, p2Normal: <Diamond className="w-4 h-4" />, p2King: <Sparkles className="w-5 h-5" /> } },
    { key: 'titanic-relic', name: 'Relíquia Titânica', desc: 'Peso e autoridade', price: 6000, rarity: 'Lendário', p1Color: 'hsl(0 0% 10%)', p2Color: 'hsl(45 100% 30%)', p1Glow: 'hsl(0 0% 30%)', p2Glow: 'hsl(45 100% 60%)', icons: { p1Normal: <Shield className="w-4 h-4" />, p1King: <Crown className="w-5 h-5" />, p2Normal: <Anchor className="w-4 h-4" />, p2King: <Trophy className="w-5 h-5" /> } },
    { key: 'infinite-nebula', name: 'Nebula Infinita', desc: 'O cosmos em suas mãos', price: 10000, rarity: 'Místico', p1Color: 'hsl(270 90% 20%)', p2Color: 'hsl(180 90% 30%)', p1Glow: 'hsl(270 100% 60%)', p2Glow: 'hsl(180 100% 60%)', icons: { p1Normal: <Moon className="w-4 h-4" />, p1King: <Sun className="w-5 h-5" />, p2Normal: <Star className="w-4 h-4" />, p2King: <Sparkles className="w-5 h-5" /> } },
    {
      key: 'dragon-legion',
      name: 'Legião do Dragão',
      desc: 'Medalhões ancestrais de dragão',
      price: 15000,
      rarity: 'Místico',
      p1Color: 'hsl(20 90% 40%)',
      p2Color: 'hsl(0 0% 10%)',
      p1Glow: 'hsl(20 100% 60%)',
      p2Glow: 'hsl(0 100% 50%)',
      sprites: {
        p1Normal: '/C:/Users/Alison Santos/.gemini/antigravity/brain/d7892b66-9857-4388-8bd9-b6f4145accf6/dragon_piece_sprite_gold_1772417356190.png',
        p1King: '/C:/Users/Alison Santos/.gemini/antigravity/brain/d7892b66-9857-4388-8bd9-b6f4145accf6/mage_king_sprite_gold_1772417567014.png',
        p2Normal: '/C:/Users/Alison Santos/.gemini/antigravity/brain/d7892b66-9857-4388-8bd9-b6f4145accf6/dragon_piece_sprite_crimson_1772417541908.png',
        p2King: '/C:/Users/Alison Santos/.gemini/antigravity/brain/d7892b66-9857-4388-8bd9-b6f4145accf6/mage_king_sprite_crimson_1772417580378.png',
      },
      icons: {
        p1Normal: <Shield className="w-4 h-4" />,
        p1King: <Crown className="w-5 h-5" />,
        p2Normal: <Skull className="w-4 h-4" />,
        p2King: <Flame className="w-5 h-5" />
      }
    },
  ];

const MiniBoard: React.FC<{ theme: typeof boardThemes[0]; selected: boolean }> = ({ theme, selected }) => {
  const [light, dark] = [theme.colors[1], theme.colors[2]];
  return (
    <div
      className="w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300"
      style={{
        borderColor: selected ? theme.colors[0] : 'transparent',
        boxShadow: selected ? `0 0 20px ${theme.colors[0]}40, 0 0 40px ${theme.colors[0]}20` : '0 4px 12px hsl(0 0% 0% / 0.3)',
      }}
    >
      <div className="grid grid-cols-4 w-full h-full">
        {Array.from({ length: 16 }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const isDark = (row + col) % 2 === 1;
          return <div key={i} style={{ background: isDark ? dark : light }} className="aspect-square" />;
        })}
      </div>
    </div>
  );
};

const PiecePreview: React.FC<{ set: typeof pieceSets[0]; selected: boolean }> = ({ set, selected }) => (
  <div
    className="flex items-center justify-center gap-3 py-3 rounded-lg border-2 transition-all duration-300"
    style={{
      borderColor: selected ? set.p1Glow : 'transparent',
      boxShadow: selected ? `0 0 20px ${set.p1Glow}40` : 'none',
      background: selected ? `linear-gradient(135deg, ${set.p1Color}15, ${set.p2Color}15)` : 'transparent',
    }}
  >
    {[
      { color: set.p1Color, glow: set.p1Glow, icon: set.icons.p1Normal, sprite: set.sprites?.p1Normal, size: 'w-9 h-9 sm:w-10 sm:h-10' },
      { color: set.p1Color, glow: set.p1Glow, icon: set.icons.p1King, sprite: set.sprites?.p1King, size: 'w-10 h-10 sm:w-11 sm:h-11' },
    ].map((p, i) => (
      <div key={`p1-${i}`} className={`${p.size} rounded-full flex items-center justify-center relative overflow-hidden`}
        style={{
          background: `radial-gradient(ellipse at 35% 25%, ${p.glow}99 0%, transparent 50%), linear-gradient(160deg, ${p.glow}, ${p.color} 50%, ${p.color}aa)`,
          boxShadow: `0 0 0 2px ${p.glow}80, 0 4px 10px hsl(0 0% 0% / 0.4), 0 0 16px ${p.glow}30, inset 0 2px 4px ${p.glow}50`,
          color: 'hsl(0 0% 100% / 0.9)',
        }}
      >
        {p.sprite ? <img src={p.sprite} alt="" className="w-full h-full object-contain p-1" /> : p.icon}
      </div>
    ))}
    <div className="w-px h-8 bg-border/30 mx-1" />
    {[
      { color: set.p2Color, glow: set.p2Glow, icon: set.icons.p2Normal, sprite: set.sprites?.p2Normal, size: 'w-9 h-9 sm:w-10 sm:h-10' },
      { color: set.p2Color, glow: set.p2Glow, icon: set.icons.p2King, sprite: set.sprites?.p2King, size: 'w-10 h-10 sm:w-11 sm:h-11' },
    ].map((p, i) => (
      <div key={`p2-${i}`} className={`${p.size} rounded-full flex items-center justify-center relative overflow-hidden`}
        style={{
          background: `radial-gradient(ellipse at 35% 25%, ${p.glow}99 0%, transparent 50%), linear-gradient(160deg, ${p.glow}, ${p.color} 50%, ${p.color}aa)`,
          boxShadow: `0 0 0 2px ${p.glow}80, 0 4px 10px hsl(0 0% 0% / 0.4), 0 0 16px ${p.glow}30, inset 0 2px 4px ${p.glow}50`,
          color: 'hsl(0 0% 100% / 0.9)',
        }}
      >
        {p.sprite ? <img src={p.sprite} alt="" className="w-full h-full object-contain p-1" /> : p.icon}
      </div>
    ))}
  </div>
);

const SelectionPage: React.FC<SelectionPageProps> = ({ boardTheme, pieceSet, onConfirm, onBack }) => {
  const [selectedBoard, setSelectedBoard] = useState<BoardTheme>(boardTheme);
  const [selectedPieces, setSelectedPieces] = useState<PieceSet>(pieceSet);
  const [tab, setTab] = useState<'boards' | 'pieces'>('boards');
  const [innerTab, setInnerTab] = useState<'collection' | 'shop'>('collection');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [ownedSkins, setOwnedSkins] = useState<string[]>(['classic-gold']);
  const [userCoins, setUserCoins] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom colors state
  const [p1Color, setP1Color] = useState<string | null>(null);
  const [p2Color, setP2Color] = useState<string | null>(null);

  const celestialColors = [
    { name: 'Ouro', hex: 'hsl(40 85% 55%)', glow: 'hsl(40 90% 65%)' },
    { name: 'Crimson', hex: 'hsl(0 75% 45%)', glow: 'hsl(0 80% 55%)' },
    { name: 'Celestial', hex: 'hsl(220 60% 50%)', glow: 'hsl(210 80% 65%)' },
    { name: 'Esmeralda', hex: 'hsl(150 60% 40%)', glow: 'hsl(150 70% 55%)' },
    { name: 'Ametista', hex: 'hsl(280 60% 45%)', glow: 'hsl(280 70% 60%)' },
    { name: 'Inferno', hex: 'hsl(15 90% 50%)', glow: 'hsl(15 95% 60%)' },
    { name: 'Gelo', hex: 'hsl(195 70% 50%)', glow: 'hsl(195 80% 65%)' },
    { name: 'Prata', hex: 'hsl(220 10% 70%)', glow: 'hsl(220 15% 85%)' },
    { name: 'Sombra', hex: 'hsl(0 0% 15%)', glow: 'hsl(270 50% 40%)' },
    { name: 'Jade', hex: 'hsl(150 90% 40%)', glow: 'hsl(150 100% 60%)' },
    { name: 'Titânico', hex: 'hsl(45 100% 30%)', glow: 'hsl(45 100% 60%)' },
    { name: 'Nebula', hex: 'hsl(270 90% 20%)', glow: 'hsl(270 100% 60%)' },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch coins and overrides
    const { data: profile } = await supabase
      .from('profiles')
      .select('celestial_coins, p1_color_override, p2_color_override')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setUserCoins(profile.celestial_coins || 0);
      setP1Color(profile.p1_color_override);
      setP2Color(profile.p2_color_override);
    }

    // Fetch owned skins
    const { data: skins } = await supabase
      .from('user_skins')
      .select('skins(key)')
      .eq('user_id', user.id);

    if (skins) {
      const keys = skins.map((s: any) => s.skins.key);
      setOwnedSkins(keys);
    }
  };

  const handlePurchase = async (set: typeof pieceSets[0]) => {
    if (userCoins < (set.price || 0)) {
      toast.error('Moedas insuficientes!', {
        description: `Você precisa de mais ${(set.price || 0) - userCoins} moedas celestiais.`
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não identificado');

      // 1. Get Skin ID
      const { data: skin } = await supabase
        .from('skins')
        .select('id')
        .eq('key', set.key)
        .single();

      if (!skin) throw new Error('Skin não encontrada no catálogo');

      // 2. Insert Ownership
      const { error: buyError } = await supabase
        .from('user_skins')
        .insert([{ user_id: user.id, skin_id: skin.id }]);

      if (buyError) throw buyError;

      // 3. Deduct Coins
      const { error: coinError } = await supabase
        .from('profiles')
        .update({ celestial_coins: userCoins - (set.price || 0) })
        .eq('id', user.id);

      if (coinError) throw coinError;

      toast.success('Aquisição Celestial concluída!', {
        description: `${set.name} agora faz parte da sua armaria.`
      });

      await fetchUserData();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro na transação cósmica');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error();

      const { error } = await supabase
        .from('profiles')
        .update({
          active_piece_set: selectedPieces,
          p1_color_override: p1Color,
          p2_color_override: p2Color,
          // Calculate glows based on selected colors to keep it simple but functional
          p1_glow_override: celestialColors.find(c => c.hex === p1Color)?.glow || null,
          p2_glow_override: celestialColors.find(c => c.hex === p2Color)?.glow || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Configurações salvas no cosmos!');
      onConfirm(selectedBoard, selectedPieces);
    } catch (err) {
      console.error('Erro ao salvar pergaminhos:', err);
      toast.error('Erro ao salvar pergaminhos', {
        description: 'Certifique-se de ter rodado o SQL de customização de cores no Supabase.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getCustomizedSet = (baseSet: typeof pieceSets[0]) => {
    const p1 = celestialColors.find(c => c.hex === p1Color);
    const p2 = celestialColors.find(c => c.hex === p2Color);

    return {
      ...baseSet,
      p1Color: p1?.hex || baseSet.p1Color,
      p1Glow: p1?.glow || baseSet.p1Glow,
      p2Color: p2?.hex || baseSet.p2Color,
      p2Glow: p2?.glow || baseSet.p2Glow,
    };
  };

  return (
    <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 w-full max-w-lg mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="font-display text-xl text-foreground text-glow-gold flex items-center justify-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Personalização
          </h2>
          <p className="text-xs text-muted-foreground font-body">Escolha seu tabuleiro e peças</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/40 backdrop-blur mb-6 w-full max-w-lg">
        <button
          onClick={() => setTab('boards')}
          className={`flex-1 py-2.5 rounded-lg font-display text-sm tracking-wide transition-all duration-300 ${tab === 'boards' ? 'gradient-gold text-primary-foreground box-glow-gold' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          🏰 Tabuleiros
        </button>
        <button
          onClick={() => setTab('pieces')}
          className={`flex-1 py-2.5 rounded-lg font-display text-sm tracking-wide transition-all duration-300 ${tab === 'pieces' ? 'gradient-gold text-primary-foreground box-glow-gold' : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          ♟️ Peças
        </button>
      </div>

      {/* Content */}
      <div className="w-full max-w-lg flex-1 animate-fade-in" key={tab}>
        {tab === 'boards' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {boardThemes.map((t) => (
              <button key={t.key} onClick={() => setSelectedBoard(t.key)} className="group flex flex-col gap-2 text-left transition-transform duration-200 hover:scale-[1.03]">
                <MiniBoard theme={t} selected={selectedBoard === t.key} />
                <div className="px-0.5">
                  <div className="flex items-center gap-1.5">
                    {selectedBoard === t.key && <Check className="w-3.5 h-3.5 text-primary" />}
                    <span className="font-display text-xs text-foreground">{t.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-body">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'pieces' && (
          <div className="flex flex-col gap-4">
            {/* Sub-tabs for pieces */}
            <div className="flex items-center gap-2 mb-2 p-1 bg-secondary/20 rounded-lg w-fit mx-auto">
              <button
                onClick={() => setInnerTab('collection')}
                className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-display transition-all ${innerTab === 'collection' ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
              >
                Minha Coleção
              </button>
              <button
                onClick={() => setInnerTab('shop')}
                className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-widest font-display transition-all ${innerTab === 'shop' ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
              >
                Loja Celestial
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gold/10 text-gold ml-2 border border-gold/20">
                <Coins className="w-3 h-3" />
                <span className="text-xs font-display">{userCoins}</span>
              </div>
            </div>

            {pieceSets.filter(s => innerTab === 'collection' ? ownedSkins.includes(s.key) : !ownedSkins.includes(s.key)).map((s) => (
              <div key={s.key} className="group text-left animate-fade-in-up">
                <div className={`relative rounded-xl p-3 bg-card/60 backdrop-blur border transition-all duration-300 ${selectedPieces === s.key ? 'border-primary/40' : 'border-border/30'}`}>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {selectedPieces === s.key && ownedSkins.includes(s.key) && <Check className="w-4 h-4 text-primary" />}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm text-foreground">{s.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${s.rarity === 'Místico' ? 'bg-cyan-500/20 text-cyan-400' :
                            s.rarity === 'Lendário' ? 'bg-purple-500/20 text-purple-400' :
                              s.rarity === 'Épico' ? 'bg-orange-500/20 text-orange-400' :
                                s.rarity === 'Raro' ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary/50 text-muted-foreground'
                            }`}>
                            {s.rarity}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-body">{s.desc}</p>
                      </div>
                    </div>

                    {innerTab === 'shop' && (
                      <button
                        onClick={() => handlePurchase(s)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span className="font-display text-xs">{s.price}</span>
                      </button>
                    )}

                    {innerTab === 'collection' && selectedPieces === s.key && (
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 text-foreground transition-all"
                        title="Customizar Cores"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="relative group">
                    <PiecePreview
                      set={ownedSkins.includes(s.key) ? getCustomizedSet(s) : s}
                      selected={selectedPieces === s.key}
                    />
                    {innerTab === 'shop' && (
                      <div className="absolute inset-0 bg-background/20 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                        <Lock className="w-6 h-6 text-muted-foreground opacity-30" />
                      </div>
                    )}
                    {innerTab === 'collection' && (
                      <button
                        onClick={() => setSelectedPieces(s.key)}
                        className="absolute inset-0 z-10 w-full h-full cursor-pointer"
                      />
                    )}
                  </div>

                  {/* Color Picker Section */}
                  {selectedPieces === s.key && innerTab === 'collection' && showColorPicker && (
                    <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/50 animate-fade-in">
                      <div className="flex flex-col gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] uppercase font-display text-muted-foreground">Cor Jogador 1 (Ouro)</label>
                            <button onClick={() => setP1Color(null)} className="text-[9px] text-primary hover:underline">Resetar</button>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {celestialColors.map(c => (
                              <button
                                key={`p1-${c.hex}`}
                                onClick={() => setP1Color(c.hex)}
                                className={`w-full aspect-square rounded-full border-2 transition-all ${p1Color === c.hex ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="w-full h-px bg-border/20" />

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] uppercase font-display text-muted-foreground">Cor Jogador 2 (Crimson)</label>
                            <button onClick={() => setP2Color(null)} className="text-[9px] text-primary hover:underline">Resetar</button>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {celestialColors.map(c => (
                              <button
                                key={`p2-${c.hex}`}
                                onClick={() => setP2Color(c.hex)}
                                className={`w-full aspect-square rounded-full border-2 transition-all ${p2Color === c.hex ? 'border-foreground scale-110 shadow-lg' : 'border-transparent'}`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}

            {innerTab === 'collection' && ownedSkins.length === 0 && (
              <div className="py-12 text-center text-muted-foreground font-body text-sm italic">
                Sua armaria está vazia... visite a loja!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="sticky bottom-4 mt-6 w-full max-w-lg">
        <button
          onClick={handleSaveAll}
          disabled={isProcessing}
          className="w-full px-8 py-4 rounded-xl gradient-gold text-primary-foreground font-display text-lg tracking-wide box-glow-gold hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          {isProcessing ? 'Sincronizando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};

export default SelectionPage;
