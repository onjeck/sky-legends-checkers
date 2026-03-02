// Checkers game engine
export type Player = 'gold' | 'crimson';
export type PieceType = 'normal' | 'king';
export type RuleSet = 'brazilian' | 'american';

export interface Piece {
  player: Player;
  type: PieceType;
  id: string;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isPromotion: boolean;
  hasNextCapture?: boolean;
}

export type Board = (Piece | null)[][];

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: 'crimson', type: 'normal', id: `c-${row}-${col}` };
      }
    }
  }

  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { player: 'gold', type: 'normal', id: `g-${row}-${col}` };
      }
    }
  }

  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getCaptures(board: Board, row: number, col: number, piece: Piece, ruleSet: RuleSet = 'brazilian'): Move[] {
  const moves: Move[] = [];

  if (piece.type === 'king' && ruleSet === 'brazilian') {
    // Flying king: slide along diagonal to find captures
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of directions) {
      let dist = 1;
      // Find the first piece along this diagonal
      while (true) {
        const midRow = row + dr * dist;
        const midCol = col + dc * dist;
        if (midRow < 0 || midRow > 7 || midCol < 0 || midCol > 7) break;
        const midPiece = board[midRow][midCol];
        if (midPiece && midPiece.player === piece.player) break; // own piece blocks
        if (midPiece && midPiece.player !== piece.player) {
          // Found enemy, check landing squares beyond
          let landDist = 1;
          while (true) {
            const endRow = midRow + dr * landDist;
            const endCol = midCol + dc * landDist;
            if (endRow < 0 || endRow > 7 || endCol < 0 || endCol > 7) break;
            if (board[endRow][endCol] !== null) break;
            moves.push({
              from: { row, col },
              to: { row: endRow, col: endCol },
              captures: [{ row: midRow, col: midCol }],
              isPromotion: false,
            });
            landDist++;
          }
          break; // can't jump over two pieces in a row
        }
        dist++;
      }
    }
  } else {
    // Normal piece or American king: jump exactly 2 squares
    const directions = piece.type === 'king'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : ruleSet === 'brazilian'
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // Brazilian: normal pieces capture in all directions
        : piece.player === 'gold'
          ? [[-1, -1], [-1, 1]]
          : [[1, -1], [1, 1]]; // American: normal pieces capture forward only

    for (const [dr, dc] of directions) {
      const midRow = row + dr;
      const midCol = col + dc;
      const endRow = row + dr * 2;
      const endCol = col + dc * 2;

      if (endRow < 0 || endRow > 7 || endCol < 0 || endCol > 7) continue;
      const midPiece = board[midRow][midCol];
      if (!midPiece || midPiece.player === piece.player) continue;
      if (board[endRow][endCol] !== null) continue;

      const isPromotion = (piece.player === 'gold' && endRow === 0) || (piece.player === 'crimson' && endRow === 7);
      moves.push({
        from: { row, col },
        to: { row: endRow, col: endCol },
        captures: [{ row: midRow, col: midCol }],
        isPromotion,
      });
    }
  }

  return moves;
}

interface CapturePath {
  firstStep: Move;
  totalCaptures: number;
}

function getMultiCapturesPaths(board: Board, row: number, col: number, piece: Piece, captured: Position[] = [], ruleSet: RuleSet = 'brazilian'): CapturePath[] {
  const singleCaptures = getCaptures(board, row, col, piece, ruleSet);
  const results: CapturePath[] = [];

  for (const cap of singleCaptures) {
    const alreadyCaptured = captured.some(c => c.row === cap.captures[0].row && c.col === cap.captures[0].col);
    if (alreadyCaptured) continue;

    const newBoard = cloneBoard(board);
    newBoard[cap.captures[0].row][cap.captures[0].col] = null;
    newBoard[row][col] = null;
    const movedPiece = cap.isPromotion ? { ...piece, type: 'king' as PieceType } : piece;
    newBoard[cap.to.row][cap.to.col] = movedPiece;

    const allCaptured = [...captured, cap.captures[0]];
    const furtherCaptures = getMultiCapturesPaths(newBoard, cap.to.row, cap.to.col, movedPiece, allCaptured, ruleSet);

    if (furtherCaptures.length === 0) {
      results.push({
        firstStep: { ...cap, hasNextCapture: false },
        totalCaptures: allCaptured.length,
      });
    } else {
      for (const further of furtherCaptures) {
        results.push({
          firstStep: { ...cap, hasNextCapture: true },
          totalCaptures: further.totalCaptures,
        });
      }
    }
  }

  return results;
}

export function getValidMoves(board: Board, row: number, col: number, ruleSet: RuleSet = 'brazilian', mustCaptureFrom?: Position | null): Move[] {
  if (mustCaptureFrom && (row !== mustCaptureFrom.row || col !== mustCaptureFrom.col)) return [];

  const piece = board[row][col];
  if (!piece) return [];

  // Check for captures first (mandatory)
  const capturesPaths = getMultiCapturesPaths(board, row, col, piece, [], ruleSet);
  const myMaxLen = capturesPaths.length > 0 ? Math.max(...capturesPaths.map(c => c.totalCaptures)) : 0;

  if (ruleSet === 'brazilian' && myMaxLen > 0) {
    // Check if any OTHER piece has a longer capture
    let globalMax = myMaxLen;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === row && c === col) continue;
        const p = board[r][c];
        if (p && p.player === piece.player) {
          const pc = getMultiCapturesPaths(board, r, c, p, [], ruleSet);
          if (pc.length > 0) {
            const pMax = Math.max(...pc.map(x => x.totalCaptures));
            if (pMax > globalMax && !mustCaptureFrom) return []; // another piece has longer capture
            globalMax = Math.max(globalMax, pMax);
          }
        }
      }
    }

    const bestPaths = capturesPaths.filter(c => c.totalCaptures === globalMax);
    const uniqueMoves = new Map<string, Move>();
    for (const path of bestPaths) {
      const key = `${path.firstStep.to.row},${path.firstStep.to.col}`;
      uniqueMoves.set(key, path.firstStep);
    }
    return Array.from(uniqueMoves.values());
  }

  if (myMaxLen > 0) {
    const uniqueMoves = new Map<string, Move>();
    for (const path of capturesPaths) {
      const key = `${path.firstStep.to.row},${path.firstStep.to.col}`;
      uniqueMoves.set(key, path.firstStep);
    }
    return Array.from(uniqueMoves.values());
  }

  if (mustCaptureFrom) return []; // Only captures allowed if locked

  // Check if any piece of this player has captures (mandatory capture rule)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.player === piece.player) {
        const pcaptures = getMultiCapturesPaths(board, r, c, p, [], ruleSet);
        if (pcaptures.length > 0) return []; // This piece can't move, another must capture
      }
    }
  }

  // Normal moves
  const moves: Move[] = [];

  if (piece.type === 'king' && ruleSet === 'brazilian') {
    // Flying king: move multiple squares along diagonal
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of directions) {
      let dist = 1;
      while (true) {
        const newRow = row + dr * dist;
        const newCol = col + dc * dist;
        if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) break;
        if (board[newRow][newCol] !== null) break;
        moves.push({
          from: { row, col },
          to: { row: newRow, col: newCol },
          captures: [],
          isPromotion: false,
        });
        dist++;
      }
    }
  } else {
    const directions = piece.type === 'king'
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.player === 'gold'
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) continue;
      if (board[newRow][newCol] !== null) continue;

      const isPromotion = (piece.player === 'gold' && newRow === 0) || (piece.player === 'crimson' && newRow === 7);
      moves.push({
        from: { row, col },
        to: { row: newRow, col: newCol },
        captures: [],
        isPromotion,
      });
    }
  }

  return moves;
}

export function getAllMoves(board: Board, player: Player, ruleSet: RuleSet = 'brazilian', mustCaptureFrom?: Position | null): Move[] {
  const allMoves: Move[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (mustCaptureFrom && (r !== mustCaptureFrom.row || c !== mustCaptureFrom.col)) continue;
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;
      const moves = getValidMoves(board, r, c, ruleSet, mustCaptureFrom);
      allMoves.push(...moves);
    }
  }

  return allMoves;
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.row][move.from.col]!;

  newBoard[move.from.row][move.from.col] = null;

  for (const cap of move.captures) {
    newBoard[cap.row][cap.col] = null;
  }

  if (move.isPromotion) {
    piece.type = 'king';
  }
  piece.id = `${piece.id}-${Date.now()}`;
  newBoard[move.to.row][move.to.col] = piece;

  return newBoard;
}

export function getWinner(board: Board, ruleSet: RuleSet = 'brazilian'): Player | 'draw' | null {
  const goldMoves = getAllMoves(board, 'gold', ruleSet);
  const crimsonMoves = getAllMoves(board, 'crimson', ruleSet);
  const goldPieces = board.flat().filter(p => p?.player === 'gold').length;
  const crimsonPieces = board.flat().filter(p => p?.player === 'crimson').length;

  if (goldPieces === 0 || goldMoves.length === 0) return 'crimson';
  if (crimsonPieces === 0 || crimsonMoves.length === 0) return 'gold';
  return null;
}

export function countPieces(board: Board, player: Player): { normal: number; kings: number } {
  let normal = 0;
  let kings = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.player === player) {
        if (cell.type === 'king') kings++;
        else normal++;
      }
    }
  }
  return { normal, kings };
}
