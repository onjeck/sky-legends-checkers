import React, { useEffect, useState } from 'react';
import heroSky from '@/assets/hero-sky.jpg';
import { Crown } from 'lucide-react';

interface LoadingScreenProps {
    onLoadingComplete: () => void;
    username: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete, username }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate loading progress
        const duration = 2500; // 2.5 seconds total loading time
        const intervalTime = 50;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const curProgress = (currentStep / steps) * 100;
            setProgress(Math.min(curProgress, 100));

            if (currentStep >= steps) {
                clearInterval(timer);
                // Add a tiny delay at 100% before transitioning
                setTimeout(onLoadingComplete, 300);
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onLoadingComplete]);

    return (
        <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Background layer */}
            <div className="absolute inset-0">
                <img src={heroSky} alt="" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm w-full animate-fade-in">

                {/* Glowing rotating crown */}
                <div className="relative w-24 h-24 mb-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-gold/20 border-t-gold/80 border-r-gold/80 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-2 rounded-full border-2 border-crimson/20 border-b-crimson/80 border-l-crimson/80 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
                    <Crown className="w-10 h-10 text-gold animate-pulse text-glow-gold" />
                </div>

                {/* Text */}
                <h2 className="font-display text-2xl text-foreground mb-2 text-center">
                    Bem-vindo, <span className="text-gold text-glow-gold">{username || 'Lenda'}</span>!
                </h2>

                {/* Progress Bar Container */}
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-8 mb-4">
                    <div
                        className="h-full gradient-gold"
                        style={{
                            width: `${progress}%`,
                            transition: 'width 100ms linear'
                        }}
                    />
                </div>

                {/* Status Text generated based on progress */}
                <p className="font-body text-sm text-muted-foreground animate-pulse">
                    {progress < 30 ? 'Conectando aos reinos celestiais...' :
                        progress < 60 ? 'Invocando as peças douradas...' :
                            progress < 90 ? 'Preparando o tabuleiro estelar...' :
                                'Tudo pronto! Entrando...'}
                </p>

            </div>
        </div>
    );
};

export default LoadingScreen;
