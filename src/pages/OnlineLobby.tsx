import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Globe, Copy, Check, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';
import socketClient from '@/game/socketClient';
import heroSky from '@/assets/hero-sky.jpg';
import FloatingParticles from '@/components/FloatingParticles';
import { toast } from 'sonner';

interface OnlineLobbyProps {
    username: string;
    onBack: () => void;
    onGameStart: (playerColor: 'gold' | 'crimson', opponentName: string, theme: string) => void;
}

const OnlineLobby: React.FC<OnlineLobbyProps> = ({ username, onBack, onGameStart }) => {
    const [view, setView] = useState<'selection' | 'setup' | 'create' | 'join' | 'list'>('selection');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [kingdomNameInput, setKingdomNameInput] = useState(`${username}'s Realm`);
    const [selectedTheme, setSelectedTheme] = useState('golden-clouds');
    const [activeRooms, setActiveRooms] = useState<any[]>([]);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [opponentFound, setOpponentFound] = useState(false);

    useEffect(() => {
        return () => {
            if (!opponentFound) {
                socketClient.disconnect();
            }
        };
    }, [opponentFound]);

    const handleCreateRoom = async () => {
        setIsConnecting(true);
        try {
            const id = await socketClient.createRoom(username, kingdomNameInput, selectedTheme);
            setCurrentRoomId(id);
            setView('create');

            socketClient.onPlayerJoined(({ opponentName }) => {
                setOpponentFound(true);
                toast.success(`${opponentName} entrou no seu reino!`);
                setTimeout(() => {
                    onGameStart('gold', opponentName, selectedTheme);
                }, 1500);
            });
        } catch (err) {
            toast.error('Erro ao criar reino celestial');
        } finally {
            setIsConnecting(false);
        }
    };

    const refreshRooms = async () => {
        setIsConnecting(true);
        try {
            const rooms = await socketClient.listRooms();
            setActiveRooms(rooms);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomIdInput.trim()) return;
        setIsConnecting(true);
        try {
            const { playerColor, opponentName, theme } = await socketClient.joinRoom(roomIdInput.toUpperCase(), username);
            setOpponentFound(true);
            toast.success(`Conectado ao reino de ${opponentName}!`);
            setTimeout(() => {
                onGameStart(playerColor, opponentName, theme);
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            toast.error(errorMessage || 'Erro ao entrar no reino');
        } finally {
            setIsConnecting(false);
        }
    };

    const copyToClipboard = () => {
        if (currentRoomId) {
            navigator.clipboard.writeText(currentRoomId);
            setIsCopied(true);
            toast.info('Código copiado!');
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center p-4 sm:p-8">
            {/* Background layer */}
            <div className="absolute inset-0">
                <img src={heroSky} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95" />
            </div>

            <FloatingParticles color="gold" count={30} />

            {/* Header */}
            <div className="relative z-10 w-full max-w-2xl flex items-center mb-12">
                <button
                    onClick={onBack}
                    className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-foreground border border-border/50 group"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <h1 className="flex-1 text-center font-display text-3xl text-glow-gold text-foreground">
                    Batalha Online
                </h1>
                <div className="w-12" />
            </div>

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                {view === 'selection' && (
                    <div className="space-y-4">
                        <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 text-center mb-8">
                            <Globe className="w-12 h-12 text-gold mx-auto mb-4 animate-pulse" />
                            <h2 className="text-xl font-display text-foreground mb-2">Conecte-se aos Reinos</h2>
                            <p className="text-sm text-muted-foreground font-body">Desafie amigos em qualquer lugar do mundo</p>
                        </div>

                        <button
                            onClick={() => setView('setup')}
                            disabled={isConnecting}
                            className="w-full group relative px-8 py-6 rounded-2xl gradient-gold text-primary-foreground font-display text-xl tracking-wide box-glow-gold hover:scale-[1.02] transition-all duration-300 overflow-hidden flex items-center justify-center gap-4 disabled:opacity-50"
                        >
                            <Plus className="w-6 h-6" />
                            Criar Novo Reino
                        </button>

                        <button
                            onClick={() => { setView('list'); refreshRooms(); }}
                            className="w-full group relative px-8 py-6 rounded-2xl bg-secondary/60 backdrop-blur-md text-foreground font-display text-xl tracking-wide border border-border/30 hover:border-primary/40 transition-all duration-300 flex items-center justify-center gap-4"
                        >
                            <Globe className="w-6 h-6" />
                            Explorar Reinos
                        </button>

                        <button
                            onClick={() => setView('join')}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body text-center"
                        >
                            Tenho um Código Secreto
                        </button>
                    </div>
                )}

                {view === 'setup' && (
                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-8 space-y-8 animate-fade-in-up">
                        <div className="text-center">
                            <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
                            <h2 className="text-2xl font-display text-foreground mb-2">Fundar Novo Reino</h2>
                            <p className="text-sm text-muted-foreground font-body">Personalize sua soberania celestial</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Nome do Reino</label>
                            <input
                                type="text"
                                value={kingdomNameInput}
                                onChange={(e) => setKingdomNameInput(e.target.value)}
                                placeholder="Nome do seu Reino"
                                className="w-full bg-background/50 border border-border/40 focus:border-gold/60 rounded-xl px-4 py-3 text-lg font-body text-foreground focus:outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-display uppercase tracking-widest text-muted-foreground">Tema do Tabuleiro</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'golden-clouds', name: 'Nuvens de Ouro' },
                                    { id: 'sunset-sky', name: 'Céu de Entardecer' },
                                    { id: 'celestial-night', name: 'Noite Celestial' },
                                    { id: 'divine-storm', name: 'Tempestade Divina' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTheme(t.id)}
                                        className={`px-4 py-3 rounded-xl border-2 transition-all text-xs font-body ${selectedTheme === t.id
                                            ? 'border-gold bg-gold/10 text-gold box-glow-gold'
                                            : 'border-border/40 hover:border-border text-muted-foreground'
                                            }`}
                                    >
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCreateRoom}
                            disabled={isConnecting || !kingdomNameInput.trim()}
                            className="w-full relative px-8 py-5 rounded-xl gradient-gold text-primary-foreground font-display text-lg tracking-wide box-glow-gold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isConnecting ? 'Relatando aos Deuses...' : 'Consagrar Reino'}
                        </button>

                        <button
                            onClick={() => setView('selection')}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body text-center"
                        >
                            Voltar
                        </button>
                    </div>
                )}

                {view === 'create' && (
                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-8 text-center space-y-8">
                        <div>
                            <Sparkles className="w-12 h-12 text-gold mx-auto mb-4 animate-float" />
                            <h2 className="text-2xl font-display text-foreground mb-2">Reino Criado!</h2>
                            <p className="text-sm text-muted-foreground font-body">Envie este código para o seu oponente</p>
                        </div>

                        <div className="relative group">
                            <div className="bg-background/60 border-2 border-dashed border-gold/40 rounded-2xl py-6 px-4 flex items-center justify-center gap-4 group-hover:border-gold transition-colors">
                                <span className="text-4xl font-display font-bold tracking-[0.2em] text-gold text-glow-gold">
                                    {currentRoomId}
                                </span>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 rounded-lg bg-secondary/80 hover:bg-gold hover:text-primary-foreground transition-all"
                                >
                                    {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 pt-4">
                            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_hsl(var(--gold))]" />
                                <span className="text-sm font-body uppercase tracking-widest">Aguardando oponente...</span>
                            </div>

                            <button
                                onClick={() => { setView('selection'); socketClient.disconnect(); }}
                                className="text-sm text-muted-foreground hover:text-crimson transition-colors font-body"
                            >
                                Cancelar Batalha
                            </button>
                        </div>
                    </div>
                )}

                {view === 'join' && (
                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-8 space-y-6">
                        <div className="text-center">
                            <Users className="w-12 h-12 text-gold mx-auto mb-4" />
                            <h2 className="text-2xl font-display text-foreground mb-2">Entrar com Código</h2>
                            <p className="text-sm text-muted-foreground font-body">Insira o código do reino celestial</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                maxLength={6}
                                value={roomIdInput}
                                onChange={(e) => setRoomIdInput(e.target.value)}
                                placeholder="EX: XY78AB"
                                className="w-full bg-background/50 border-2 border-border/40 focus:border-gold/60 rounded-xl px-4 py-5 text-center text-3xl font-display font-bold tracking-[0.3em] uppercase text-gold focus:outline-none transition-all placeholder:text-muted-foreground/30"
                            />

                            <button
                                onClick={handleJoinRoom}
                                disabled={isConnecting || roomIdInput.length < 6}
                                className="w-full relative px-8 py-5 rounded-xl gradient-gold text-primary-foreground font-display text-lg tracking-wide box-glow-gold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isConnecting ? 'Conectando...' : 'Invadir Reino'}
                            </button>

                            <button
                                onClick={() => setView('selection')}
                                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body text-center"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                )}

                {view === 'list' && (
                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-8 space-y-6 max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-2xl font-display text-foreground">Reinos Ativos</h2>
                                <p className="text-xs text-muted-foreground font-body">Escolha um destino para guerrear</p>
                            </div>
                            <button
                                onClick={refreshRooms}
                                className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                            >
                                <RotateCcw className={`w-5 h-5 ${isConnecting ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {activeRooms.length === 0 ? (
                                <div className="text-center py-12 opacity-50">
                                    <Globe className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-sm font-body">Nenhum reino encontrado no momento...</p>
                                </div>
                            ) : (
                                activeRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="bg-background/40 border border-border/30 rounded-xl p-4 flex items-center justify-between group hover:border-gold/30 transition-all"
                                    >
                                        <div>
                                            <h3 className="font-display text-lg text-foreground group-hover:text-gold transition-colors">{room.kingdomName}</h3>
                                            <p className="text-xs text-muted-foreground font-body">Soberano: {room.username} • {room.theme}</p>
                                        </div>
                                        <button
                                            onClick={() => { setRoomIdInput(room.id); handleJoinRoom(); }}
                                            className="px-4 py-2 rounded-lg bg-gold/10 hover:bg-gold text-gold hover:text-primary-foreground text-xs font-display border border-gold/20 transition-all uppercase tracking-wider"
                                        >
                                            Entrar
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setView('selection')}
                            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body text-center"
                        >
                            Voltar
                        </button>
                    </div>
                )}

                {opponentFound && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-card/90 border border-gold/50 p-10 rounded-3xl text-center space-y-6 box-glow-gold scale-110">
                            <div className="relative w-24 h-24 mx-auto">
                                <Users className="w-full h-full text-gold animate-bounce" />
                                <div className="absolute -inset-4 border-2 border-dashed border-gold/30 rounded-full animate-spin-slow" />
                            </div>
                            <h3 className="text-3xl font-display text-foreground">Batalha Encontrada!</h3>
                            <p className="font-body text-muted-foreground">O destino foi traçado. Prepare-se!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnlineLobby;
