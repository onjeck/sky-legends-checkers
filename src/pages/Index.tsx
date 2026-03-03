import React, { useState } from 'react';
import heroSky from '@/assets/hero-sky.jpg';
import FloatingParticles from '@/components/FloatingParticles';
import GameBoard from '@/components/GameBoard';
import SettingsPage, { RuleSet } from '@/components/SettingsPage';
import SelectionPage, { BoardTheme, PieceSet } from '@/components/SelectionPage';
import AuthPage from './AuthPage';
import LoadingScreen from './LoadingScreen';
import ProfilePage, { AVATAR_OPTIONS, getPlayerTitle } from './ProfilePage';
import OnlineLobby from './OnlineLobby';
import { Difficulty } from '@/game/aiPlayer';
import { setSoundEnabled, isSoundEnabled } from '@/game/soundEngine';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Brain, Zap, Star, Crown, Settings, Palette, User, Globe } from 'lucide-react';
import { Player } from '@/game/checkersEngine';
import socketClient from '@/game/socketClient';

type Screen = 'menu' | 'customize' | 'difficulty' | 'settings' | 'game' | 'profile' | 'lobby';
type GameMode = 'ai' | 'local' | 'online';

const difficulties: { key: Difficulty; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'easy', label: 'Fácil', desc: 'Para aprender o jogo', icon: <Star className="w-5 h-5" /> },
  { key: 'medium', label: 'Médio', desc: 'Desafio equilibrado', icon: <Brain className="w-5 h-5" /> },
  { key: 'hard', label: 'Difícil', desc: 'Para jogadores experientes', icon: <Zap className="w-5 h-5" /> },
  { key: 'celestial', label: 'Mestre Celestial', desc: 'O desafio supremo', icon: <Crown className="w-5 h-5" /> },
];

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null means checking
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [elo, setElo] = useState(1000);
  const [avatarUrl, setAvatarUrl] = useState('user');

  const [screen, setScreen] = useState<Screen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>(() => (localStorage.getItem('difficulty') as Difficulty) || 'easy');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => (localStorage.getItem('boardTheme') as BoardTheme) || 'golden-clouds');
  const [pieceSet, setPieceSet] = useState<PieceSet>(() => (localStorage.getItem('pieceSet') as PieceSet) || 'classic-gold');
  const [ruleSet, setRuleSet] = useState<RuleSet>(() => (localStorage.getItem('ruleSet') as RuleSet) || 'brazilian');
  const [gameMode, setGameMode] = useState<GameMode>(() => (localStorage.getItem('gameMode') as GameMode) || 'ai');
  const [onlineOpponent, setOnlineOpponent] = useState<string | null>(null);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<Player | null>(null);

  // Piece Color Overrides
  const [p1ColorOverride, setP1ColorOverride] = useState<string | null>(null);
  const [p2ColorOverride, setP2ColorOverride] = useState<string | null>(null);
  const [p1GlowOverride, setP1GlowOverride] = useState<string | null>(null);
  const [p2GlowOverride, setP2GlowOverride] = useState<string | null>(null);

  React.useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, active_piece_set, p1_color_override, p1_glow_override, p2_color_override, p2_glow_override, elo, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUsername(data.username || 'Guerreiro');
        if (data.active_piece_set) setPieceSet(data.active_piece_set as PieceSet);
        setP1ColorOverride(data.p1_color_override);
        setP1GlowOverride(data.p1_glow_override);
        setP2ColorOverride(data.p2_color_override);
        setP2GlowOverride(data.p2_glow_override);
        setElo(data.elo || 1000);
        setAvatarUrl(data.avatar_url || 'user');
      } else {
        // Fallback to email if profile hasn't been created yet
        const { data: { user } } = await supabase.auth.getUser();
        setUsername(user?.email?.split('@')[0] || 'Guerreiro');
      }
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setIsAuthenticated(true);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('difficulty', difficulty);
    localStorage.setItem('boardTheme', boardTheme);
    localStorage.setItem('pieceSet', pieceSet);
    localStorage.setItem('ruleSet', ruleSet);
    localStorage.setItem('gameMode', gameMode);
  }, [difficulty, boardTheme, pieceSet, ruleSet, gameMode]);

  if (isAuthenticated === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!isAuthenticated) {
    return <AuthPage onLogin={(name) => { setUsername(name); setIsLoading(true); setIsAuthenticated(true); }} />;
  }

  if (isLoading) {
    return <LoadingScreen username={username} onLoadingComplete={() => setIsLoading(false)} />;
  }

  if (screen === 'lobby') {
    return <OnlineLobby
      username={username}
      onBack={() => {
        socketClient.disconnect('Abbandono Lobby');
        setScreen('menu');
      }}
      onGameStart={(color, opponent, theme) => {
        console.log('[INDEX] onGameStart - Color:', color, 'Opponent:', opponent, 'Theme:', theme);
        setGameMode('online');
        setOnlinePlayerColor(color as Player);
        setOnlineOpponent(opponent);
        setBoardTheme(theme as any);
        setScreen('game');
      }}
    />;
  }

  if (screen === 'game') {
    return <GameBoard
      difficulty={difficulty}
      boardTheme={boardTheme}
      pieceSet={pieceSet}
      ruleSet={ruleSet}
      gameMode={gameMode}
      onBack={() => {
        setScreen('menu');
        setOnlinePlayerColor(null);
        setOnlineOpponent(null);
        if (gameMode === 'online') socketClient.disconnect('Abandono Jogo');
      }}
      onlinePlayerColor={onlinePlayerColor}
      onlineOpponentName={onlineOpponent}
      colorOverrides={{
        p1Color: p1ColorOverride,
        p1Glow: p1GlowOverride,
        p2Color: p2ColorOverride,
        p2Glow: p2GlowOverride
      }}
    />;
  }

  if (screen === 'profile') {
    return <ProfilePage username={username} onBack={() => setScreen('menu')} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroSky} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/95" />
      </div>

      <FloatingParticles color="gold" count={20} />

      {screen === 'settings' ? (
        <SettingsPage
          currentRuleSet={ruleSet}
          soundEnabled={isSoundEnabled()}
          onConfirm={(rs, soundOn) => { setRuleSet(rs); setSoundEnabled(soundOn); setScreen('menu'); }}
          onBack={() => setScreen('menu')}
        />
      ) : screen === 'customize' ? (
        <SelectionPage
          boardTheme={boardTheme}
          pieceSet={pieceSet}
          onConfirm={async (b, p) => {
            setBoardTheme(b);
            setPieceSet(p);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) await fetchProfile(session.user.id);
            setScreen('menu');
          }}
          onBack={() => setScreen('menu')}
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-6">
          {screen === 'menu' && (
            <>
              {/* Profile Widget */}
              <div
                className="absolute top-6 left-6 flex items-center gap-3 bg-card/40 backdrop-blur-md border border-border/50 p-3 pr-6 rounded-2xl cursor-pointer hover:bg-card/60 transition-all group box-glow-gold/20"
                onClick={() => setScreen('profile')}
              >
                <div className="relative w-12 h-12 rounded-full gradient-gold p-0.5 box-glow-gold/40">
                  <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center border-2 border-background overflow-hidden relative z-10">
                    {(() => {
                      const Icon = AVATAR_OPTIONS.find(a => a.id === avatarUrl)?.icon || User;
                      return <Icon className="w-6 h-6 text-gold group-hover:scale-110 transition-transform duration-300" />;
                    })()}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-display text-foreground group-hover:text-gold transition-colors">{username}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-body uppercase tracking-[0.2em] text-muted-foreground">{getPlayerTitle(elo)}</span>
                    <span className="text-xs font-display text-primary">[{elo}]</span>
                  </div>
                </div>
              </div>
              <div className="text-center animate-fade-in w-full max-w-md">
                {/* Title */}
                <div className="mb-4">
                  <h1 className="font-display text-5xl sm:text-7xl font-bold text-foreground text-glow-gold tracking-wider">
                    SKY LEGENDS
                  </h1>
                  <p className="font-display text-xl sm:text-2xl text-primary tracking-[0.3em] mt-1">
                    CHECKERS
                  </p>
                </div>

                <p className="text-muted-foreground font-body text-sm sm:text-base max-w-md mx-auto mb-6">
                  O jogo de damas mais épico entre as nuvens douradas
                </p>

                {/* Menu buttons */}
                <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                  <button
                    onClick={() => { setGameMode('ai'); setScreen('difficulty'); }}
                    className="group relative px-8 py-4 rounded-xl gradient-gold text-primary-foreground font-display text-lg tracking-wide box-glow-gold hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Swords className="w-5 h-5" />
                      Jogar vs IA
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>

                  <button
                    onClick={() => setScreen('lobby')}
                    className="group relative px-8 py-4 rounded-xl bg-primary/20 backdrop-blur text-foreground font-display text-lg tracking-wide border border-gold/30 hover:border-gold/60 hover:bg-primary/30 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Globe className="w-5 h-5 text-gold" />
                      Batalha Online
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>

                  <button
                    onClick={() => { setGameMode('local'); setScreen('game'); }}
                    className="group relative px-8 py-4 rounded-xl bg-secondary/60 backdrop-blur text-foreground font-display text-lg tracking-wide border border-border/30 hover:border-primary/40 hover:bg-secondary/80 transition-all duration-300 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <Swords className="w-5 h-5" />
                      Local 1v1
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setScreen('profile')}
                      className="flex-1 group px-4 py-3 rounded-xl bg-secondary/40 backdrop-blur text-foreground font-display text-sm tracking-wide border border-border/30 hover:border-gold/40 hover:bg-secondary/80 transition-all duration-300"
                    >
                      <span className="flex flex-col items-center justify-center gap-1">
                        <User className="w-5 h-5 text-gold group-hover:scale-110 transition-transform duration-300" />
                        Perfil
                      </span>
                    </button>
                    <button
                      onClick={() => setScreen('customize')}
                      className="flex-1 group px-4 py-3 rounded-xl bg-secondary/40 backdrop-blur text-foreground font-display text-sm tracking-wide border border-border/30 hover:border-primary/40 hover:bg-secondary/80 transition-all duration-300"
                    >
                      <span className="flex flex-col items-center justify-center gap-1">
                        <Palette className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                        Loja
                      </span>
                    </button>
                    <button
                      onClick={() => setScreen('settings')}
                      className="flex-1 group px-4 py-3 rounded-xl bg-secondary/40 backdrop-blur text-foreground font-display text-sm tracking-wide border border-border/30 hover:border-primary/40 hover:bg-secondary/80 transition-all duration-300"
                    >
                      <span className="flex flex-col items-center justify-center gap-1">
                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Ajustes
                      </span>
                    </button>
                  </div>
                </div>

                {/* Decorative */}
                <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground/40">
                  <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/30" />
                  <Star className="w-3 h-3 text-gold/40" />
                  <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/30" />
                </div>
              </div>
            </>
          )}

          {screen === 'difficulty' && (
            <div className="text-center animate-fade-in w-full max-w-sm">
              <h2 className="font-display text-2xl text-foreground text-glow-gold mb-1">Escolha a Dificuldade</h2>
              <p className="text-sm text-muted-foreground font-body mb-8">Desafie a IA celestial</p>

              <div className="flex flex-col gap-3">
                {difficulties.map((d, i) => (
                  <button
                    key={d.key}
                    onClick={() => { setDifficulty(d.key); setScreen('game'); }}
                    className="group relative flex items-center gap-4 px-5 py-4 rounded-xl bg-card/60 backdrop-blur border border-border/30 hover:border-gold/40 hover:box-glow-gold transition-all duration-300 text-left"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary group-hover:gradient-gold group-hover:text-primary-foreground transition-all">
                      {d.icon}
                    </div>
                    <div>
                      <span className="font-display text-sm text-foreground">{d.label}</span>
                      <p className="text-xs text-muted-foreground font-body">{d.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setScreen('menu')}
                className="mt-6 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                ← Voltar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
