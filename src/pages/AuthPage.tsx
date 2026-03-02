import React, { useState } from 'react';
import heroSky from '@/assets/hero-sky.jpg';
import FloatingParticles from '@/components/FloatingParticles';
import { LogIn, User, Lock, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthPageProps {
    onLogin: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // Only for signup
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // Fetch username from profiles after login
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', data.user.id)
                    .single();

                onLogin(profile?.username || email.split('@')[0]);
                toast.success('Bem-vindo de volta ao reino!');
            } else {
                if (!username.trim()) throw new Error('Nome de guerreiro é obrigatório!');

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username,
                        }
                    }
                });

                if (error) throw error;

                toast.success('Sua lenda começou! Verifique seu email ou faça login.');
                setIsLogin(true);
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro na conexão celestial');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
            {/* Background layer */}
            <div className="absolute inset-0">
                <img src={heroSky} alt="Sky Legends" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background/95" />
            </div>

            <FloatingParticles color="gold" count={30} />

            {/* Login Box */}
            <div className="relative z-10 w-full max-w-md animate-fade-in-up">
                {/* Title Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-gold/10 text-gold box-glow-gold mb-4 animate-float">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground text-glow-gold tracking-wider">
                        SKY LEGENDS
                    </h1>
                    <p className="font-display text-lg text-primary tracking-[0.3em] mt-1">
                        CHECKERS
                    </p>
                </div>

                {/* Form Container */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
                >
                    {/* Subtle glow behind form */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <h2 className="text-xl font-display text-foreground mb-6 text-center">
                        {isLogin ? 'Acesse o Reino' : 'Inicie sua Saga'}
                    </h2>

                    <div className="space-y-4 relative z-10">
                        {/* Username Input (Only for Signup) */}
                        {!isLogin && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="text-xs font-body text-muted-foreground ml-1 uppercase tracking-wider">Nome de Guerreiro (Apelido)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-gold transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50"
                                        placeholder="Seu nome de lenda..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-body text-muted-foreground ml-1 uppercase tracking-wider">Essência Celestial (Email)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-gold transition-colors">
                                    <User className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50"
                                    placeholder="seu@cosmos.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-body text-muted-foreground ml-1 uppercase tracking-wider">Chave Mestra (Senha)</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-gold transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all placeholder:text-muted-foreground/50"
                                    placeholder="Sua senha secreta..."
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="w-full mt-6 group relative px-8 py-4 rounded-xl gradient-gold text-primary-foreground font-display text-lg tracking-wide box-glow-gold hover:scale-[1.02] transition-all duration-300 overflow-hidden flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLogin ? (
                                    <LogIn className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                                ) : (
                                    <UserPlus className={`w-5 h-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                                )}
                                {isLoading ? 'Processando...' : isLogin ? 'Entrar no Jogo' : 'Criar Conta'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="w-full text-center text-sm text-gold hover:text-gold-glow transition-colors font-body mt-4"
                        >
                            {isLogin ? 'Novo por aqui? Crie sua conta' : 'Já é um guerreiro? Faça login'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-xs text-muted-foreground/60 mt-6 font-body">
                    Sky Legends Checkers © 2026. Todos os direitos cósmicos reservados.
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
