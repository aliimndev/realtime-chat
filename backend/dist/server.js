import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(cors());
app.use(express.static('../public'));
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});
// Jalankan setup Redis & server di dalam async function
(async () => {
    try {
        // === REDIS ADAPTER ===
        const pubClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        // === SOCKET LOGIC ===
        io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);
            socket.on('chat', (data) => {
                const payload = {
                    username: data.username || 'Anonymous',
                    message: data.message,
                    timestamp: Date.now()
                };
                io.emit('chat', payload);
            });
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
        const PORT = process.env.PORT || 3000;
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server jalan di http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Gagal start server:', err);
        process.exit(1);
    }
})();
