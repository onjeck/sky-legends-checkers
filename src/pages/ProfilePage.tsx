import React, { useEffect, useState } from 'react';
import FloatingParticles from '@/components/FloatingParticles';
import {
    ArrowLeft, User, Trophy, Flame, Star, Crown, Shield, LogOut,
    Edit2, Save, X, Ghost, Skull, Zap, Moon, Sun, Sparkles, Coins
} from 'lucide-react';
import heroSky from '@/assets/hero-sky.jpg';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfilePageProps {
    onBack: () => void;
    username: string;
}

interface ProfileData {
    username: string;
    elo: number;
    games_played: number;
    games_won: number;
    avatar_url: string | null;
    celestial_coins: number;
}

export const AVATAR_OPTIONS = [
    { id: 'user', icon: User, name: 'Guerreiro' },
    { id: 'ghost', icon: Ghost, name: 'Espectro' },
    { id: 'skull', icon: Skull, name: 'Sombrio' },
    { id: 'zap', icon: Zap, name: 'Relâmpago' },
    { id: 'star', icon: Star, name: 'Estrela' },
    { id: 'moon', icon: Moon, name: 'Lunar' },
    { id: 'sun', icon: Sun, name: 'Solar' },
    { id: 'shield', icon: Shield, name: 'Guardião' },
    { id: 'crown', icon: Crown, name: 'Soberano' },
];

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, username: initialUsername }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit state
    const [editedUsername, setEditedUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('user');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('username, elo, games_played, games_won, avatar_url, celestial_coins')
            .eq('id', user.id)
            .maybeSingle(); // Use maybeSingle to avoid error if missing

        if (error) {
            console.error('Erro Supabase:', error);
            toast.error('Erro ao acessar os reinos celestiais');
        } else if (!data) {
            // Profile missing? Let's try to create it (self-healing)
            const newUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'Guerreiro';
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: user.id, username: newUsername, avatar_url: 'user' }])
                .select()
                .single();

            if (insertError) {
                console.error('Erro ao criar perfil:', insertError);
                toast.error('Não conseguimos registrar sua lenda. Verifique o banco de dados.');
            } else {
                setProfile(newProfile);
                setEditedUsername(newProfile.username || '');
                setSelectedAvatar(newProfile.avatar_url || 'user');
            }
        } else {
            setProfile(data);
            setEditedUsername(data.username || '');
            setSelectedAvatar(data.avatar_url || 'user');
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!editedUsername.trim() || editedUsername.length < 3) {
            toast.error('Nome de guerreiro deve ter pelo menos 3 caracteres');
            return;
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não encontrado');

            const { error } = await supabase
                .from('profiles')
                .update({
                    username: editedUsername,
                    avatar_url: selectedAvatar
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Pérfil celestial atualizado!');
            setIsEditing(false);
            await fetchProfile();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao sincronizar com o cosmos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Erro ao sair do reino');
        } else {
            toast.info('Até a próxima batalha, guerreiro!');
            onBack();
        }
    };


    const wins = profile?.games_won || 0;
    const total = profile?.games_played || 0;
    const losses = total - wins;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const elo = profile?.elo || 1000;
    const title = getPlayerTitle(elo);

    const CurrentAvatarIcon = AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.icon || User;

    if (isLoading && !isEditing) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center p-4 sm:p-8">
            {/* Background layer */}
            <div className="absolute inset-0">
                <img src={heroSky} alt="Sky Legends" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background/95" />
            </div>

            <FloatingParticles color="gold" count={40} />

            {/* Header */}
            <div className="relative z-10 w-full max-w-4xl flex items-center mb-8">
                <button
                    onClick={isEditing ? () => setIsEditing(false) : onBack}
                    className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-foreground border border-border/50 group"
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <h1 className="flex-1 text-center font-display text-3xl sm:text-4xl text-glow-gold text-foreground">
                    {isEditing ? 'Configurar Avatar' : 'Perfil da Lenda'}
                </h1>
                <button
                    onClick={handleLogout}
                    className="p-3 rounded-xl bg-crimson/20 hover:bg-crimson/40 transition-colors text-crimson border border-crimson/30 group"
                    title="Sair do Jogo"
                >
                    <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
            </div>

            <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">

                {/* Profile Card / Edit Mode */}
                <div className="md:col-span-1 bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 flex flex-col items-center relative overflow-hidden text-center shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-gold/5 object-cover pointer-events-none" />

                    {!isEditing ? (
                        <>
                            {/* Avatar container */}
                            <div className="relative w-32 h-32 rounded-full mb-6 mt-4">
                                <div className="absolute inset-0 rounded-full border-4 border-gold/40 animate-spin-slow pointer-events-none" style={{ animationDuration: '4s' }} />
                                <div className="absolute inset-1 rounded-full border-2 border-dashed border-crimson/50 animate-spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '5s' }} />
                                <div className="w-full h-full rounded-full bg-secondary/80 flex items-center justify-center border-2 border-gold/80 overflow-hidden box-glow-gold relative z-10">
                                    <CurrentAvatarIcon className="w-16 h-16 text-gold drop-shadow-md" />
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute bottom-0 right-0 p-2 rounded-full gradient-gold text-primary-foreground border-2 border-background shadow-lg hover:scale-110 transition-all z-20"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h2 className="font-display text-2xl text-foreground mb-1">{profile?.username || initialUsername}</h2>
                            <div className="flex items-center gap-2 text-gold mb-6">
                                <Crown className="w-4 h-4" />
                                <span className="font-body text-sm font-semibold tracking-wide uppercase">{title}</span>
                            </div>

                            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent mb-6" />

                            <div className="w-full flex justify-between px-4 mb-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-body mb-1">Elo</span>
                                    <span className="font-display text-2xl text-primary">{elo}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-body mb-1">Moedas</span>
                                    <div className="flex items-center gap-1.5">
                                        <Coins className="w-4 h-4 text-gold" />
                                        <span className="font-display text-2xl text-foreground text-glow-gold">{profile?.celestial_coins || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full space-y-6">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-secondary/80 flex items-center justify-center border-2 border-gold/80 box-glow-gold mb-4">
                                    <CurrentAvatarIcon className="w-12 h-12 text-gold" />
                                </div>

                                <div className="w-full space-y-2 text-left">
                                    <label className="text-xs font-body text-muted-foreground uppercase tracking-widest">Identidade</label>
                                    <input
                                        type="text"
                                        value={editedUsername}
                                        onChange={(e) => setEditedUsername(e.target.value)}
                                        className="w-full bg-background/50 border border-gold/30 rounded-xl px-4 py-2 text-foreground focus:ring-1 focus:ring-gold/50 outline-none"
                                        placeholder="Nome da lenda..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {AVATAR_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelectedAvatar(opt.id)}
                                        className={`p-3 rounded-xl border flex items-center justify-center transition-all ${selectedAvatar === opt.id
                                            ? 'bg-gold/20 border-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                            : 'bg-secondary/40 border-border/50 hover:border-gold/30'
                                            }`}
                                    >
                                        <opt.icon className={`w-6 h-6 ${selectedAvatar === opt.id ? 'text-gold' : 'text-muted-foreground'}`} />
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 rounded-xl bg-secondary/50 text-foreground font-display flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 rounded-xl gradient-gold text-primary-foreground font-display flex items-center justify-center gap-2 box-glow-gold"
                                >
                                    <Save className="w-4 h-4" /> Gravar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-xl relative overflow-hidden group hover:border-gold/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy className="w-24 h-24 text-gold" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-gold/10 text-gold">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <h3 className="font-display text-xl text-foreground">Vitórias</h3>
                            </div>
                            <div>
                                <span className="font-display text-5xl text-gold">{wins}</span>
                                <p className="text-sm font-body text-muted-foreground mt-2">Partidas vencidas majestosamente</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-xl relative overflow-hidden group hover:border-crimson/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Flame className="w-24 h-24 text-crimson" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-crimson/10 text-crimson">
                                    <Flame className="w-6 h-6" />
                                </div>
                                <h3 className="font-display text-xl text-foreground">Derrotas</h3>
                            </div>
                            <div>
                                <span className="font-display text-5xl text-crimson">{losses < 0 ? 0 : losses}</span>
                                <p className="text-sm font-body text-muted-foreground mt-2">Batalhas que trouxeram aprendizado</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/50 p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors sm:col-span-2 flex items-center justify-between">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                <Shield className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-display text-xl text-foreground mb-1">Total Jogado</h3>
                                <p className="text-sm font-body text-muted-foreground">Sua jornada épica pelos reinos</p>
                            </div>
                        </div>
                        <span className="relative z-10 font-display text-4xl text-blue-400">{total}</span>
                    </div>

                </div>

            </div>
        </div>
    );
};

export const getPlayerTitle = (elo: number) => {
    if (elo >= 2400) return 'Mestre Celestial';
    if (elo >= 2000) return 'Guardião das Nuvens';
    if (elo >= 1600) return 'Guerreiro de Elite';
    if (elo >= 1200) return 'Explorador dos Céus';
    return 'Iniciante do Reino';
};

export default ProfilePage;
