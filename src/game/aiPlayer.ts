import { Board, Move, Player, Position, getAllMoves, applyMove, countPieces, cloneBoard, RuleSet } from './checkersEngine';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'celestial';

function evaluateBoard(board: Board, aiPlayer: Player): number {
  const opponent: Player = aiPlayer === 'crimson' ? 'gold' : 'crimson';
  const ai = countPieces(board, aiPlayer);
  const opp = countPieces(board, opponent);

  let score = (ai.normal - opp.normal) * 10 + (ai.kings - opp.kings) * 25;

  // Positional bonuses
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const multiplier = piece.player === aiPlayer ? 1 : -1;

      // Center control
      if (c >= 2 && c <= 5 && r >= 2 && r <= 5) score += 2 * multiplier;

      // Advancement bonus for normal pieces
      if (piece.type === 'normal') {
        const advancement = piece.player === 'crimson' ? r : 7 - r;
        score += advancement * multiplier;
      }
    }
  }

  return score;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean, aiPlayer: Player, ruleSet: RuleSet, mustCaptureFrom: Position | null = null): number {
  const currentPlayer: Player = maximizing ? aiPlayer : (aiPlayer === 'crimson' ? 'gold' : 'crimson');
  const moves = getAllMoves(board, currentPlayer, ruleSet, mustCaptureFrom);

  if (depth === 0 || moves.length === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  // Move ordering: prioritize captures and promotions
  moves.sort((a, b) => {
    const scoreA = a.captures.length * 10 + (a.isPromotion ? 5 : 0);
    const scoreB = b.captures.length * 10 + (b.isPromotion ? 5 : 0);
    return scoreB - scoreA;
  });

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const nextMaximizing = move.hasNextCapture ? true : false;
      const nextDepth = move.hasNextCapture ? depth : depth - 1;
      const nextCaptureFrom = move.hasNextCapture ? move.to : null;

      const evalScore = minimax(newBoard, nextDepth, alpha, beta, nextMaximizing, aiPlayer, ruleSet, nextCaptureFrom);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const nextMaximizing = move.hasNextCapture ? false : true;
      const nextDepth = move.hasNextCapture ? depth : depth - 1;
      const nextCaptureFrom = move.hasNextCapture ? move.to : null;

      const evalScore = minimax(newBoard, nextDepth, alpha, beta, nextMaximizing, aiPlayer, ruleSet, nextCaptureFrom);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(board: Board, player: Player, difficulty: Difficulty, ruleSet: RuleSet = 'brazilian', mustCaptureFrom: Position | null = null): Move | null {
  const moves = getAllMoves(board, player, ruleSet, mustCaptureFrom);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === 'medium' ? 2 : difficulty === 'hard' ? 4 : 6;

  // For medium, add some randomness
  if (difficulty === 'medium' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const newBoard = applyMove(board, move);
    const nextMaximizing = move.hasNextCapture ? true : false;
    const nextDepth = move.hasNextCapture ? depth : depth - 1;
    const nextCaptureFrom = move.hasNextCapture ? move.to : null;

    const score = minimax(newBoard, nextDepth, -Infinity, Infinity, nextMaximizing, player, ruleSet, nextCaptureFrom);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
