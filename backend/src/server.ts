import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid'; // ini sudah benar

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static('../../frontend/dist')); // adjust kalau path beda

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Redis setup (top-level await OK setelah tsconfig fix)
const pubClient = createClient({ 
  url: process.env.REDIS_URL || 'redis://localhost:6379' 
});
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));

// Interface events (bisa dipindah ke file terpisah nanti)
interface ServerEvents {
  message: (msg: { room: string; username: string; text: string }) => void;
  typing: (data: { room: string; username: string; isTyping: boolean }) => void;
  joinRoom: (room: string) => void;
}

io.on('connection', async (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room
  socket.on('joinRoom', async (room: string) => {
    if (!room) return;

    socket.join(room);
    await pubClient.sAdd(`online:${room}`, socket.id);

    // Load history (max 50 pesan terbaru – Redis List dari paling baru)
    const historyRaw = await pubClient.lRange(`chat:${room}`, 0, 49);
    // Fix error 2345: explicit parse tanpa reviver
    const history = historyRaw.map(str => JSON.parse(str));

    socket.emit('history', history);

    // Broadcast join (bisa improve dengan username real nanti)
    io.to(room).emit('userJoined', { id: socket.id, username: 'User' });
  });

  // Message
  socket.on('message', async (data: { room: string; username: string; text: string }) => {
    if (!data.room || !data.text) return;

    const msg = {
      id: uuidv4(),
      username: data.username || 'Anonymous',
      text: data.text,
      timestamp: Date.now(),
      room: data.room
    };

    await pubClient.lPush(`chat:${data.room}`, JSON.stringify(msg));
    await pubClient.lTrim(`chat:${data.room}`, 0, 999); // batasi 1000 pesan

    io.to(data.room).emit('message', msg);
  });

  // Typing indicator
  socket.on('typing', (data: { room: string; isTyping: boolean }) => {
    if (!data.room) return;
    socket.to(data.room).emit('typing', { username: 'Someone', isTyping: data.isTyping });
  });

  socket.on('disconnect', async () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    for (const room of rooms) {
      await pubClient.sRem(`online:${room}`, socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});