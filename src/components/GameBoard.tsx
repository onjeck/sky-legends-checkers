import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Board, Move, Position, Player, createInitialBoard, getValidMoves, applyMove, getWinner, countPieces, getAllMoves, RuleSet } from '@/game/checkersEngine';
import { getAIMove, Difficulty } from '@/game/aiPlayer';
import socketClient from '@/game/socketClient';
import GamePiece from './GamePiece';
import FloatingParticles from './FloatingParticles';
import CaptureEffect, { CaptureEffectType, getRandomEffect } from './CaptureEffect';
import { Trophy, RotateCcw, ArrowLeft, Box, Square, Globe } from 'lucide-react';
import { playSelect, playMove, playCapture, playKing, playVictory, playDefeat, playInvalid } from '@/game/soundEngine';
import { BoardTheme, PieceSet, pieceSets } from './SelectionPage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GameBoardProps {
  difficulty: Difficulty;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;
  ruleSet: RuleSet;
  gameMode: 'ai' | 'local' | 'online';
  onBack: () => void;
  colorOverrides?: {
    p1Color: string | null;
    p1Glow: string | null;
    p2Color: string | null;
    p2Glow: string | null;
  };
}

const boardColors: Record<BoardTheme, { light: string; dark: string; accent: string }> = {
  'golden-clouds': { light: 'hsl(35 30% 65%)', dark: 'hsl(225 30% 15%)', accent: 'hsl(40 85% 55%)' },
  'sunset-sky': { light: 'hsl(35 40% 60%)', dark: 'hsl(280 30% 18%)', accent: 'hsl(20 90% 55%)' },
  'celestial-night': { light: 'hsl(240 20% 40%)', dark: 'hsl(240 40% 10%)', accent: 'hsl(220 60% 45%)' },
  'divine-storm': { light: 'hsl(220 15% 30%)', dark: 'hsl(220 25% 8%)', accent: 'hsl(200 30% 35%)' },
  'arcade-paradise': { light: 'hsl(180 60% 50%)', dark: 'hsl(260 40% 15%)', accent: 'hsl(320 70% 55%)' },
};

const GameBoard: React.FC<GameBoardProps> = ({ difficulty, boardTheme, pieceSet: basePieceSet, ruleSet, gameMode, onBack, colorOverrides }) => {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('gold');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [captureSequencePos, setCaptureSequencePos] = useState<Position | null>(null);
  const [viewMode, setViewMode] = useState<'2.5d' | '2d'>('2.5d');
  const [captureEffects, setCaptureEffects] = useState<{ id: number; row: number; col: number; type: CaptureEffectType }[]>([]);
  const captureIdRef = useRef(0);
  const aiTimeoutRef = useRef<number>();

  const recordGameResult = useCallback(async (winnerColor: Player | 'draw') => {
    if (winnerColor === 'draw') return;

    // Only record results for registered users
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Determine if the logged-in user won
    let userWon = false;
    if (gameMode === 'online') {
      userWon = winnerColor === socketClient.playerColor;
    } else if (gameMode === 'ai') {
      userWon = winnerColor === 'gold';
    } else {
      // For local mode, we only record for gold (arbitrary)
      userWon = winnerColor === 'gold';
    }

    // Update profile stats
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('elo, games_played, games_won')
        .eq('id', user.id)
        .single();

      if (profile) {
        const newElo = userWon ? profile.elo + 25 : Math.max(800, profile.elo - 20);

        await supabase
          .from('profiles')
          .update({
            games_played: profile.games_played + 1,
            games_won: userWon ? profile.games_won + 1 : profile.games_won,
            elo: newElo
          })
          .eq('id', user.id);

        toast.info(userWon ? `Vitória Épica! +25 Elo` : `Derrota Honrosa. -20 Elo`, {
          description: `Novo Elo: ${newElo}`
        });
      }
    } catch (err) {
      console.error('Erro ao salvar pergaminhos:', err);
    }
  }, [gameMode]);

  const triggerCaptureEffects = useCallback((captures: Position[]) => {
    const newEffects = captures.map(pos => ({
      id: captureIdRef.current++,
      row: pos.row,
      col: pos.col,
      type: getRandomEffect(),
    }));
    setCaptureEffects(prev => [...prev, ...newEffects]);
  }, []);

  const removeCaptureEffect = useCallback((id: number) => {
    setCaptureEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const goldCount = countPieces(board, 'gold');
  const crimsonCount = countPieces(board, 'crimson');

  // Handle Online Disconnect
  useEffect(() => {
    if (gameMode === 'online') {
      socketClient.onPlayerDisconnected(() => {
        toast.error('Oponente se desconectou do reino!');
        setWinner(socketClient.playerColor === 'gold' ? 'gold' : 'crimson');
      });
    }
  }, [gameMode]);

  // Opponent Online move
  useEffect(() => {
    if (gameMode !== 'online') return;

    socketClient.onOpponentMove((move) => {
      if (move.captures.length > 0) {
        playCapture();
        triggerCaptureEffects(move.captures);
      } else playMove();

      if (move.isPromotion) setTimeout(() => playKing(), 200);

      const newBoard = applyMove(board, move);
      setBoard(newBoard);
      setLastMove(move);

      if (move.hasNextCapture) {
        setCaptureSequencePos(move.to);
        // Turn stays the same
      } else {
        setCaptureSequencePos(null);
        setCurrentPlayer(socketClient.playerColor || 'gold'); // It's our turn now
      }

      const w = getWinner(newBoard, ruleSet);
      if (w) setWinner(w);
    });
  }, [board, ruleSet, gameMode, triggerCaptureEffects]);

  // AI move
  useEffect(() => {
    if (gameMode !== 'ai') return;
    if (currentPlayer === 'crimson' && !winner) {
      setIsAIThinking(true);
      aiTimeoutRef.current = window.setTimeout(() => {
        const move = getAIMove(board, 'crimson', difficulty, ruleSet, captureSequencePos);
        if (move) {
          if (move.captures.length > 0) {
            playCapture();
            triggerCaptureEffects(move.captures);
          }
          else playMove();
          if (move.isPromotion) setTimeout(() => playKing(), 200);

          const newBoard = applyMove(board, move);
          setBoard(newBoard);
          setLastMove(move);

          if (move.hasNextCapture) {
            setCaptureSequencePos(move.to);
          } else {
            setCaptureSequencePos(null);
            setCurrentPlayer('gold');
          }

          const w = getWinner(newBoard, ruleSet);
          if (w) {
            setWinner(w);
            recordGameResult(w);
            setTimeout(() => w === 'gold' ? playVictory() : playDefeat(), 300);
          }
        }
        setIsAIThinking(false);
      }, 600);
    }
    return () => { if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current); };
  }, [currentPlayer, board, winner, difficulty, ruleSet, gameMode, captureSequencePos, triggerCaptureEffects]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (winner) return;

    // Online locking logic
    if (gameMode === 'online') {
      if (currentPlayer !== socketClient.playerColor) return;
    } else if (gameMode === 'ai') {
      if (currentPlayer !== 'gold') return;
    }

    const piece = board[row][col];

    if (selectedPos) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      if (move) {
        if (move.captures.length > 0) {
          playCapture();
          triggerCaptureEffects(move.captures);
        }
        else playMove();

        if (move.isPromotion) setTimeout(() => playKing(), 200);

        const newBoard = applyMove(board, move);
        setBoard(newBoard);
        setLastMove(move);

        // Sync move if online
        if (gameMode === 'online') {
          socketClient.sendMove(move);
        }

        if (move.hasNextCapture) {
          setCaptureSequencePos(move.to);
          setSelectedPos(move.to);
          setValidMoves(getValidMoves(newBoard, move.to.row, move.to.col, ruleSet, move.to));
        } else {
          setCaptureSequencePos(null);
          setSelectedPos(null);
          setValidMoves([]);
          setCurrentPlayer(currentPlayer === 'gold' ? 'crimson' : 'gold');
        }

        const w = getWinner(newBoard, ruleSet);
        if (w) {
          setWinner(w);
          recordGameResult(w);
          if (gameMode === 'local') {
            setTimeout(() => playVictory(), 300);
          } else {
            setTimeout(() => w === 'gold' ? playVictory() : playDefeat(), 300);
          }
        }
        return;
      }

      if (piece && piece.player === currentPlayer) {
        if (captureSequencePos && (row !== captureSequencePos.row || col !== captureSequencePos.col)) {
          playInvalid();
          return;
        }
        playSelect();
        setSelectedPos({ row, col });
        setValidMoves(getValidMoves(board, row, col, ruleSet, captureSequencePos));
        return;
      }

      // Deselect logic
      if (!captureSequencePos) {
        playInvalid();
        setSelectedPos(null);
        setValidMoves([]);
      } else {
        playInvalid();
      }
      return;
    }

    if (piece && piece.player === currentPlayer) {
      if (captureSequencePos && (row !== captureSequencePos.row || col !== captureSequencePos.col)) {
        playInvalid();
        return;
      }
      playSelect();
      setSelectedPos({ row, col });
      setValidMoves(getValidMoves(board, row, col, ruleSet, captureSequencePos));
    }
  }, [board, currentPlayer, selectedPos, validMoves, winner, captureSequencePos, ruleSet, gameMode, triggerCaptureEffects]);

  const resetGame = () => {
    setBoard(createInitialBoard());
    setCurrentPlayer('gold');
    setSelectedPos(null);
    setValidMoves([]);
    setWinner(null);
    setLastMove(null);
    setIsAIThinking(false);
    setCaptureSequencePos(null);
  };

  const isValidTarget = (row: number, col: number) =>
    validMoves.some(m => m.to.row === row && m.to.col === col);

  const isLastMoveCell = (row: number, col: number) =>
    lastMove && ((lastMove.from.row === row && lastMove.from.col === col) || (lastMove.to.row === row && lastMove.to.col === col));

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    celestial: 'Mestre Celestial',
  };

  return (
    <div className="relative min-h-screen gradient-sky flex flex-col items-center justify-center p-4 overflow-hidden">
      <FloatingParticles color="gold" count={25} />

      {/* Clouds background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[20%] bg-cloud/5 rounded-full blur-3xl" style={{ animation: 'cloud-drift 20s ease-in-out infinite alternate' }} />
        <div className="absolute top-[30%] right-[-10%] w-[50%] h-[25%] bg-cloud/3 rounded-full blur-3xl" style={{ animation: 'cloud-drift 25s ease-in-out infinite alternate-reverse' }} />
        <div className="absolute bottom-[20%] left-[10%] w-[35%] h-[15%] bg-cloud/4 rounded-full blur-3xl" style={{ animation: 'cloud-drift 18s ease-in-out infinite alternate' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 mb-4 w-full max-w-lg">
        <button onClick={onBack} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <h2 className="font-display text-lg text-foreground text-glow-gold flex items-center justify-center gap-2">
            {gameMode === 'online' && <Globe className="w-4 h-4 text-gold animate-pulse" />}
            Sky Legends Checkers
          </h2>
          <p className="text-xs text-muted-foreground">{gameMode === 'local' ? 'Local 1v1' : gameMode === 'online' ? `Online vs ${socketClient.opponentName}` : difficultyLabels[difficulty]}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === '2.5d' ? '2d' : '2.5d')}
            className={`p-2 rounded-lg transition-colors ${viewMode === '2d' ? 'bg-primary/20 text-primary box-glow-gold' : 'bg-secondary/50 hover:bg-secondary text-foreground'}`}
            title={viewMode === '2.5d' ? 'Mudar para 2D Plano' : 'Mudar para 2.5D'}
          >
            {viewMode === '2.5d' ? <Square className="w-5 h-5" /> : <Box className="w-5 h-5" />}
          </button>
          <button onClick={resetGame} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-foreground">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Score */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-lg mb-4 px-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentPlayer === 'gold' && !winner ? 'box-glow-gold bg-gold/10' : 'bg-secondary/30'} transition-all`}>
          <div className="w-4 h-4 rounded-full gradient-gold" />
          <span className="text-sm font-body text-foreground">{goldCount.normal + goldCount.kings}</span>
          {goldCount.kings > 0 && <span className="text-xs text-gold-glow">({goldCount.kings}👑)</span>}
        </div>
        <div className="text-xs text-muted-foreground font-body">
          {isAIThinking ? '🤔 IA pensando...' : winner ? '' : gameMode === 'local' ? (currentPlayer === 'gold' ? 'Vez do Ouro' : 'Vez do Vermelho') : gameMode === 'online' ? (currentPlayer === socketClient.playerColor ? 'Seu Turno' : `Vez de ${socketClient.opponentName}`) : (currentPlayer === 'gold' ? 'Sua vez' : 'Vez da IA')}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentPlayer === 'crimson' && !winner ? 'box-glow-crimson bg-crimson/10' : 'bg-secondary/30'} transition-all`}>
          <span className="text-sm font-body text-foreground">{crimsonCount.normal + crimsonCount.kings}</span>
          {crimsonCount.kings > 0 && <span className="text-xs text-crimson-glow">({crimsonCount.kings}👑)</span>}
          <div className="w-4 h-4 rounded-full gradient-crimson" />
        </div>
      </div>

      {/* Board */}
      <div
        className="relative z-10 transition-transform duration-500 ease-out"
        style={{ transform: viewMode === '2d' ? 'scale(1.05)' : 'scale(1)' }}
      >
        <div
          className="relative rounded-xl overflow-visible transition-all duration-700 ease-out"
          style={{
            transform: viewMode === '2.5d' ? 'perspective(800px) rotateX(25deg) rotateZ(0deg)' : 'none',
          }}
        >
          {/* Board shadow */}
          <div
            className="absolute -inset-2 rounded-2xl transition-all duration-700 ease-out"
            style={{
              background: 'rgba(0,0,0,0.35)',
              filter: viewMode === '2.5d' ? 'blur(20px)' : 'blur(10px)',
              transform: viewMode === '2.5d' ? 'translateY(12px)' : 'translateY(4px)',
              zIndex: -1,
            }}
          />

          {/* Front edge */}
          <div
            className={`absolute left-0 right-0 transition-opacity duration-500 ${viewMode === '2.5d' ? 'opacity-100' : 'opacity-0'}`}
            style={{
              bottom: '-14px',
              height: '14px',
              background: 'linear-gradient(to bottom, hsl(20 10% 15%), hsl(20 10% 6%))',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          />

          {/* Right edge */}
          <div
            className={`absolute top-0 bottom-0 transition-opacity duration-500 ${viewMode === '2.5d' ? 'opacity-100' : 'opacity-0'}`}
            style={{
              right: '-10px',
              width: '10px',
              background: 'linear-gradient(to right, hsl(20 10% 12%), hsl(20 10% 5%))',
              marginBottom: '-14px',
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          />

          {/* Board surface */}
          <div className="rounded-lg overflow-hidden relative border border-foreground/10">
            <div className="grid grid-cols-8 gap-0">
              {board.map((row, rowIdx) =>
                row.map((cell, colIdx) => {
                  const isDark = (rowIdx + colIdx) % 2 === 1;
                  const isTarget = isValidTarget(rowIdx, colIdx);
                  const isLast = isLastMoveCell(rowIdx, colIdx);
                  const isSelectedCell = selectedPos?.row === rowIdx && selectedPos?.col === colIdx;
                  const colors = boardColors[boardTheme];

                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center transition-colors duration-200 cursor-pointer"
                      style={{
                        background: isLast && isDark
                          ? `${colors.accent}33`
                          : isDark ? colors.dark : colors.light,
                      }}
                    >
                      {isTarget && (
                        <div className="absolute inset-0 flex items-center justify-center z-5">
                          <div className={`
                              w-4 h-4 rounded-full animate-glow-pulse
                              ${validMoves.find(m => m.to.row === rowIdx && m.to.col === colIdx)?.captures.length
                              ? 'bg-crimson/40 ring-2 ring-crimson-glow/50'
                              : 'bg-gold/30 ring-2 ring-gold-glow/40'
                            }
                            `} />
                        </div>
                      )}

                      {captureEffects
                        .filter(e => e.row === rowIdx && e.col === colIdx)
                        .map(e => (
                          <CaptureEffect
                            key={e.id}
                            row={e.row}
                            col={e.col}
                            effectType={e.type}
                            onComplete={() => removeCaptureEffect(e.id)}
                          />
                        ))
                      }

                      {cell && (
                        <GamePiece
                          piece={cell}
                          isSelected={isSelectedCell || false}
                          onClick={() => handleCellClick(rowIdx, colIdx)}
                          pieceSet={basePieceSet}
                          colorOverrides={colorOverrides}
                          sprites={pieceSets.find(s => s.key === basePieceSet)?.sprites}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner overlay */}
      {
        winner && winner !== 'draw' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center animate-scale-in">
              <FloatingParticles color={winner === 'gold' ? 'gold' : 'celestial'} count={50} />
              <Trophy className={`w-16 h-16 mx-auto mb-4 ${winner === 'gold' ? 'text-gold' : 'text-crimson'}`} />
              <h2 className="font-display text-3xl text-glow-gold text-foreground mb-2">
                {gameMode === 'local'
                  ? (winner === 'gold' ? '🏆 Ouro Venceu!' : '🏆 Vermelho Venceu!')
                  : (winner === 'gold' ? '🏆 Vitória!' : '💀 Derrota!')}
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                {gameMode === 'local'
                  ? `Jogador ${winner === 'gold' ? 'Ouro' : 'Vermelho'} dominou o tabuleiro!`
                  : (winner === 'gold' ? 'Você venceu a IA!' : 'A IA venceu desta vez.')}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={resetGame}
                  className="px-6 py-3 rounded-lg gradient-gold text-primary-foreground font-display text-sm box-glow-gold hover:scale-105 transition-transform"
                >
                  Jogar Novamente
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-body text-sm hover:bg-secondary/80 transition-colors"
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default GameBoard;
