import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectedClient, roomJoinData } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});
const clients: connectedClient[] = [];

const addClient = (data: connectedClient) => {
  const exists = clients.findIndex((item) => item.id === data.id);
  if (exists === -1) {
    clients.push(data);
  }
};

const removeClient = (clientID: string) => {
  const index = clients.findIndex((item) => item.id === clientID);
  if (index > -1) clients.splice(index, 1);
};

app.use(express.static('src/frontend'));

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/frontend/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  io.to(socket.id).emit('welcome', 'welcome');
  socket.on('joinRoom', (msg: roomJoinData) => {
    socket.join(msg.room);
    addClient({
      id: socket.id,
      room: msg.room,
      device: msg.device,
    });
    clients.forEach((client) => {
      io.to(client.id).emit('clients', clients);
    });
  });
  socket.on('request', (clientID: string) => {
    io.to(clientID).emit('request');
  });
  socket.on('respond', (res: any) => {
    console.log(res);
  });
  socket.on('disconnect', () => {
    console.log('a user disconnected', socket.id);
    removeClient(socket.id);
  });
});

httpServer.listen(3000, () => {
  console.log('listening on *http://localhost:3000');
});
