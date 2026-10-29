const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3002;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let saveTimeout = null;

// Her odanın çizim geçmişini ayrı tutan nesne: { "genel": [...], "ekip1": [...] }
let roomsHistory = {};
if (fs.existsSync(DATA_FILE)) {
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(rawData);
        // Eski data.json düz liste (Array) ise 'genel' odasına aktar
        if (Array.isArray(parsed)) {
            roomsHistory = { genel: parsed };
        } else {
            roomsHistory = parsed;
        }
        console.log('Diskten oda verileri basariyla yuklendi.');
    } catch (err) {
        console.error('Veri dosyasi okunurken hata olustu, sifirdan baslaniyor:', err);
        roomsHistory = {};
    }
}

function saveToDisk() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        fs.writeFile(DATA_FILE, JSON.stringify(roomsHistory), (err) => {
            if (err) console.error('Diske yazma hatasi:', err);
        });
    }, 1000);
}

app.use(express.static(path.join(__dirname, 'public')));

// /oda/oda-adi şeklinde girildiğinde de ana çizim sayfasını aç
app.get('/oda/:roomName', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    let currentRoom = 'genel';

    // Kullanıcı bir odaya katıldığında
    socket.on('join_room', (roomName) => {
        currentRoom = (roomName || 'genel').trim().toLowerCase();
        socket.join(currentRoom);

        if (!roomsHistory[currentRoom]) {
            roomsHistory[currentRoom] = [];
        }

        console.log(`Kullanici (${socket.id}) [${currentRoom}] odasina baglandi.`);
        socket.emit('init_board', roomsHistory[currentRoom]);
    });

    // Çizim geldiğinde sadece o odadakilere gönder
    socket.on('draw', (data) => {
        if (!roomsHistory[currentRoom]) {
            roomsHistory[currentRoom] = [];
        }
        roomsHistory[currentRoom].push(data);
        saveToDisk();
        socket.to(currentRoom).emit('draw', data);
    });

    // Temizle komutu geldiğinde sadece o odayı sıfırla
    socket.on('clear', () => {
        roomsHistory[currentRoom] = [];
        saveToDisk();
        socket.to(currentRoom).emit('clear');
    });

    socket.on('disconnect', () => {
        console.log(`Kullanici ayrildi: ${socket.id} (Oda: ${currentRoom})`);
    });
});

server.listen(PORT, () => {
    console.log(`Oda Destekli Whiteboard calisiyor: http://localhost:${PORT}`);
});