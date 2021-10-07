import express from 'express';
import path from 'path';
import ip from 'ip';
import QRCode from 'qrcode';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  connectedClient,
  fileRequest,
  fileSend,
  newFolderRequest,
  roomJoinData,
} from './types';

const generateUrlQR = () => {
  const localIP: string = ip.address();
  QRCode.toFile('src/frontend/qr.png', `http://${localIP}:3000`);
};

generateUrlQR();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {});
let clients: connectedClient[] = [];

const addClient = (data: connectedClient) => {
  const exists = clients.findIndex((item) => item.id === data.id);
  if (exists === -1) {
    clients.push(data);
  } else {
    clients = clients.map((client) => {
      if (client.id === data.id) {
        const clientRoomUpdated = { ...client, room: data.room };
        return clientRoomUpdated;
      } else return client;
    });
  }
};

const removeClient = (clientID: string) => {
  const index = clients.findIndex((item) => item.id === clientID);
  if (index > -1) clients.splice(index, 1);
};

app.use(express.static('src/frontend'));

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '/frontend/index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinRoom', (msg: roomJoinData) => {
    socket.join(msg.room);
    addClient({
      id: socket.id,
      room: msg.room,
      device: msg.device,
    });
    const commonClients = clients.filter((client) => client.room === msg.room);

    commonClients.forEach((client) => {
      io.to(client.id).emit('clients', commonClients);
    });
  });

  socket.on('request', (msg: fileRequest) => {
    io.to(msg.device).emit('request', msg);
  });

  socket.on('readfile', (msg: fileRequest) => {
    io.to(msg.device).emit('readfile', msg);
  });

  socket.on('respond', (res: any) => {
    const browserClient = clients.find((client) => client.device === 'browser');
    if (browserClient) {
      io.to(browserClient.id).emit('respond', res);
    }
  });

  socket.on('respondfile', (res: any) => {
    const browserClient = clients.find((client) => client.device === 'browser');
    if (browserClient) {
      io.to(browserClient.id).emit('respondfile', res);
    }
  });

  socket.on('newfolder', (msg: newFolderRequest) => {
    io.to(msg.device).emit('newfolder', msg);
  });

  socket.on('sendfile', (msg: fileSend) => {
    io.to(msg.device).emit('sendfile', msg);
    console.log(msg.path);
  });

  socket.on('disconnect', () => {
    console.log('a user disconnected', socket.id);
    removeClient(socket.id);
    clients.forEach((client) => {
      io.to(client.id).emit('clients', clients);
    });
  });
});

httpServer.listen(3000, () => {
  console.log('listening on *http://localhost:3000');
});
