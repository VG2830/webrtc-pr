// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('client')); // serve frontend
// app.use(express.static('ionic-app/src/app')); // serve frontend

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  },
});

let users = {};

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('register', (userId) => {
    users[userId] = socket.id;
    console.log(`🔐 Registered ${userId} -> ${socket.id}`);
    io.emit('user-list', users);
  });
// io.on('connection', (socket) => {
//   const userId = socket.handshake.query.userId;
//   users[userId] = socket.id;
//   console.log(`Registered ${userId} via handshake`);


  socket.on('call-user', (data) => {
    const targetSocketId = users[data.to];
    if (targetSocketId) {
      console.log(`📞 ${data.to} = ${targetSocketId}`);
      socket.to(targetSocketId).emit('call-made', {
        offer: data.offer,
        from: socket.id,
        callerId: data.from,
      });
    } else {
      console.log(`❌ User ${data.to} not connected`);
    }
  });

  socket.on('make-answer', (data) => {
    const targetSocketId = users[data.to];
    if (targetSocketId) {
      socket.to(targetSocketId).emit('answer-made', {
        answer: data.answer,
        from: socket.id,
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const targetSocketId = users[data.to];
    if (targetSocketId) {
      socket.to(targetSocketId).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id,
      });
    }
  });

  socket.on('disconnect', () => {
    for (let id in users) {
      if (users[id] === socket.id) {
        delete users[id];
        console.log(`❌ Disconnected: ${id}`);
      }
    }
    io.emit('user-list', users);
  });
});

server.listen(3000, () => console.log('🚀 Signaling server running on http://localhost:3000'));
