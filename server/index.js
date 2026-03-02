import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-room', ({ username, kingdomName, theme }) => {
        console.log(`[SERVER] Create room requested by ${username} (${socket.id})`);
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(roomId, {
            id: roomId,
            kingdomName: kingdomName || `${username}'s Realm`,
            theme: theme || 'golden-clouds',
            username, // creator
            players: [{ id: socket.id, username, color: 'gold' }],
            moves: []
        });
        socket.join(roomId);
        socket.emit('room-created', { roomId, playerColor: 'gold' });
        console.log(`[SERVER] Kingdom ${kingdomName} (${roomId}) created. Creator: ${username}`);
    });

    socket.on('join-room', ({ roomId, username }) => {
        console.log(`[SERVER] Join room ${roomId} requested by ${username} (${socket.id})`);
        const room = rooms.get(roomId);
        if (!room) {
            console.warn(`[SERVER] Join failed: Room ${roomId} not found`);
            socket.emit('error', 'Reino não encontrado!');
            return;
        }

        if (room.players.length >= 2) {
            console.warn(`[SERVER] Join failed: Room ${roomId} is full`);
            socket.emit('error', 'Reino já está cheio!');
            return;
        }

        room.players.push({ id: socket.id, username, color: 'crimson' });
        socket.join(roomId);

        const opponent = room.players[0];
        socket.emit('room-joined', {
            roomId,
            playerColor: 'crimson',
            opponentName: opponent.username,
            kingdomName: room.kingdomName,
            theme: room.theme
        });

        // Notify the creator that someone joined
        socket.to(roomId).emit('player-joined', {
            opponentName: username
        });

        console.log(`[SERVER] ${username} joined kingdom ${room.kingdomName} (${roomId}). Opponent: ${opponent.username}`);
    });

    socket.on('list-rooms', () => {
        const activeRooms = Array.from(rooms.values())
            .filter(room => room.players.length < 2)
            .map(room => ({
                id: room.id,
                kingdomName: room.kingdomName,
                theme: room.theme,
                username: room.username
            }));
        socket.emit('rooms-list', activeRooms);
    });

    socket.on('make-move', ({ roomId, move }) => {
        // Relay move to the other player in the room
        socket.to(roomId).emit('opponent-move', move);
    });

    socket.on('chat-message', ({ roomId, message, username }) => {
        socket.to(roomId).emit('receive-message', { message, username });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [roomId, room] of rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted`);
                } else {
                    socket.to(roomId).emit('player-disconnected');
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Celestial relay server running on port ${PORT}`);
});
