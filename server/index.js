import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

// Health check for cloud deployment
app.get('/health', (req, res) => {
    res.status(200).send('Celestial Relay is Active');
});

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

    socket.on('create-room', ({ username, kingdomName, theme, pieceSet, colorOverrides }) => {
        console.log(`[SERVER] Create room requested by ${username} (${socket.id})`);
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(roomId, {
            id: roomId,
            kingdomName: kingdomName || `${username}'s Realm`,
            theme: theme || 'golden-clouds',
            username, // creator
            players: [{
                id: socket.id,
                username,
                color: 'gold',
                pieceSet: pieceSet || 'classic-gold',
                colorOverrides: colorOverrides || null
            }],
            moves: []
        });
        socket.join(roomId);
        socket.emit('room-created', { roomId, playerColor: 'gold' });
        console.log(`[SERVER] Kingdom ${kingdomName} (${roomId}) created. Creator: ${username}`);
    });

    socket.on('join-room', ({ roomId, username, pieceSet, colorOverrides }) => {
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

        const newPlayer = {
            id: socket.id,
            username,
            color: 'crimson',
            pieceSet: pieceSet || 'classic-gold',
            colorOverrides: colorOverrides || null
        };
        room.players.push(newPlayer);
        socket.join(roomId);

        const host = room.players[0];

        // Respond to the one who joined with host's style
        socket.emit('room-joined', {
            roomId,
            playerColor: 'crimson',
            opponentName: host.username,
            opponentPieceSet: host.pieceSet,
            opponentColorOverrides: host.colorOverrides,
            kingdomName: room.kingdomName,
            theme: room.theme
        });

        // Notify the host that someone joined with their style
        socket.to(roomId).emit('player-joined', {
            opponentName: username,
            opponentPieceSet: newPlayer.pieceSet,
            opponentColorOverrides: newPlayer.colorOverrides
        });

        console.log(`[SERVER] ${username} joined kingdom ${room.kingdomName} (${roomId}). Opponent: ${host.username}`);
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
