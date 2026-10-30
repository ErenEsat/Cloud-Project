const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Kalıcı depolama (Persistence) klasörü ve dosyası
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'documents.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

let documents = {};
if (fs.existsSync(DATA_FILE)) {
    try {
        documents = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        documents = {};
    }
}

// Veriyi diske kaydetme fonksiyonu
function saveToDisk() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(documents, null, 2), 'utf8');
}

// Oda bazlı aktif kullanıcı takibi
const roomUsers = {};

io.on('connection', (socket) => {
    let currentRoom = 'varsayilan-belge';
    let currentUser = 'Anonim';

    socket.on('join-room', ({ roomId, username }) => {
        socket.leave(currentRoom);
        currentRoom = roomId || 'varsayilan-belge';
        currentUser = username || 'Anonim';

        socket.join(currentRoom);

        // Oda ilk kez açılıyorsa boş belge oluştur
        if (!documents[currentRoom]) {
            documents[currentRoom] = { ops: [{ insert: 'Buraya birlikte yazmaya başlayın...\n' }] };
            saveToDisk();
        }

        // Kullanıcı listesini güncelle
        if (!roomUsers[currentRoom]) roomUsers[currentRoom] = {};
        roomUsers[currentRoom][socket.id] = currentUser;

        // Yeni girene belgenin son halini gönder
        socket.emit('load-document', documents[currentRoom]);

        // Odadaki herkese güncel kullanıcı listesini gönder
        io.to(currentRoom).emit('room-users', Object.values(roomUsers[currentRoom]));
    });

    // Bir kullanıcı harf/biçim değiştirdiğinde sadece farkı (Delta) diğerlerine gönder
    socket.on('send-changes', (delta) => {
        socket.broadcast.to(currentRoom).emit('receive-changes', delta);
    });

    // Belgenin tam halini bellekte ve diskte güncelle
    socket.on('save-document', (fullContent) => {
        documents[currentRoom] = fullContent;
        saveToDisk();
    });

    socket.on('disconnect', () => {
        if (roomUsers[currentRoom] && roomUsers[currentRoom][socket.id]) {
            delete roomUsers[currentRoom][socket.id];
            io.to(currentRoom).emit('room-users', Object.values(roomUsers[currentRoom]));
        }
    });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Collab Word Editor calisiyor: http://localhost:${PORT}`);
});