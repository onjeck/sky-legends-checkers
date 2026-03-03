import { io, Socket } from 'socket.io-client';
import { Move } from './checkersEngine';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

class SocketClient {
    private socket: Socket | null = null;
    private roomId: string | null = null;
    public playerColor: 'gold' | 'crimson' | null = null;
    public opponentName: string | null = null;
    public kingdomName: string | null = null;
    public boardTheme: string | null = null;

    connect() {
        if (!this.socket) {
            console.log(`[SOCKET] Tentando conectar ao servidor: ${SERVER_URL}`);
            this.socket = io(SERVER_URL, {
                transports: ['websocket', 'polling'], // Garantir compatibilidade maior
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log(`[SOCKET] Conectado com sucesso ao relay: ${this.socket?.id}`);
            });

            this.socket.on('connect_error', (error) => {
                console.error(`[SOCKET] Erro na conexão com ${SERVER_URL}:`, error.message);
            });

            this.socket.on('disconnect', (reason) => {
                console.log(`[SOCKET] Desconectado: ${reason}`);
            });
        }
        return this.socket;
    }

    createRoom(username: string, kingdomName: string, theme: string): Promise<string> {
        return new Promise((resolve) => {
            const socket = this.connect();

            socket.once('room-created', ({ roomId, playerColor }) => {
                this.roomId = roomId;
                this.playerColor = playerColor;
                this.kingdomName = kingdomName;
                this.boardTheme = theme;
                resolve(roomId);
            });

            socket.emit('create-room', { username, kingdomName, theme });
        });
    }

    joinRoom(roomId: string, username: string): Promise<{ playerColor: 'gold' | 'crimson', opponentName: string, kingdomName: string, theme: string }> {
        return new Promise((resolve, reject) => {
            const socket = this.connect();

            socket.once('room-joined', ({ playerColor, opponentName, kingdomName, theme }) => {
                this.roomId = roomId;
                this.playerColor = playerColor;
                this.opponentName = opponentName;
                this.kingdomName = kingdomName;
                this.boardTheme = theme;
                resolve({ playerColor, opponentName, kingdomName, theme });
            });

            socket.once('error', (msg) => {
                reject(msg);
            });

            socket.emit('join-room', { roomId, username });
        });
    }

    listRooms(): Promise<any[]> {
        return new Promise((resolve) => {
            const socket = this.connect();

            socket.once('rooms-list', (rooms) => {
                resolve(rooms);
            });

            socket.emit('list-rooms');
        });
    }

    sendMove(move: Move) {
        if (this.socket && this.roomId) {
            this.socket.emit('make-move', { roomId: this.roomId, move });
        }
    }

    onOpponentMove(callback: (move: Move) => void) {
        this.socket?.on('opponent-move', callback);
    }

    offOpponentMove(callback: (move: Move) => void) {
        this.socket?.off('opponent-move', callback);
    }

    onPlayerJoined(callback: (data: { opponentName: string }) => void) {
        const wrapper = (data: { opponentName: string }) => {
            this.opponentName = data.opponentName;
            callback(data);
        };
        // Store wrapper to allow removal
        (callback as any)._wrapper = wrapper;
        this.socket?.on('player-joined', wrapper);
    }

    offPlayerJoined(callback: (data: { opponentName: string }) => void) {
        const wrapper = (callback as any)._wrapper;
        this.socket?.off('player-joined', wrapper || callback);
    }

    onPlayerDisconnected(callback: () => void) {
        this.socket?.on('player-disconnected', callback);
    }

    offPlayerDisconnected(callback: () => void) {
        this.socket?.off('player-disconnected', callback);
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this.roomId = null;
        this.playerColor = null;
        this.opponentName = null;
    }
}

export const socketClient = new SocketClient();
export default socketClient;
