const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
// Socket.io'nun çalışması için Express'i HTTP sunucusuna bağlıyoruz
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3002;

app.use(express.static(path.join(__dirname, 'public')));

// Bir tarayıcı (istemci) sunucuya bağlandığında tetiklenir
io.on('connection', (socket) => {
    console.log(`Yeni bir kullanici baglandi! ID: ${socket.id}`);

    // 1. İstemciden 'draw' (çizim) verisi geldiğinde:
    socket.on('draw', (data) => {
        // Gönderen kişi HARİÇ diğer herkese bu çizim koordinatlarını ilet
        socket.broadcast.emit('draw', data);
    });

    // 2. İstemciden 'clear' (tahtayı temizle) komutu geldiğinde:
    socket.on('clear', () => {
        // Gönderen kişi HARİÇ diğer herkesin ekranını temizlet
        socket.broadcast.emit('clear');
    });

    // Kullanıcı sekmeyi kapattığında:
    socket.on('disconnect', () => {
        console.log(`Kullanici ayrildi: ${socket.id}`);
    });
});

// DİKKAT: Artık app.listen değil, server.listen kullanıyoruz!
server.listen(PORT, () => {
    console.log(`Canli Whiteboard sunucusu calisiyor: http://localhost:${PORT}`);
});