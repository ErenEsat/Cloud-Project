const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3002;

// Çizimlerin kaydedileceği klasör ve dosya yolu
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// 'data' klasörü yoksa otomatik oluştur
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let saveTimeout = null;

// Sunucu başlarken diskte eski çizimler varsa RAM'e (drawingHistory) yükle
let drawingHistory = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        drawingHistory = JSON.parse(rawData);
        console.log(`Diskten ${drawingHistory.length} adet cizim adimi yuklendi.`);
    } catch (err) {
        console.error('Veri dosyasi okunurken hata olustu, sifirdan baslaniyor:', err);
        drawingHistory = [];
    }
}

// RAM'deki çizimleri diske (data.json) kaydeden fonksiyon
// Çizim devam ederken diske yazmayı bekletir, çizim durduktan 1 sn sonra ТЕK SEFERDE yazar
function saveToDisk() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        fs.writeFile(DATA_FILE, JSON.stringify(drawingHistory), (err) => {
            if (err) console.error('Diske yazma hatasi:', err);
        });
    }, 1000);
}

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log(`Yeni bir kullanici baglandi! ID: ${socket.id}`);

    // Bağlanan kullanıcıya o ana kadar çizilmiş tüm geçmişi gönder
    socket.emit('init_board', drawingHistory);

    // Yeni bir çizgi geldiğinde:
    socket.on('draw', (data) => {
        drawingHistory.push(data); // 1. RAM'e ekle
        saveToDisk();              // 2. Diske kaydet
        socket.broadcast.emit('draw', data); // 3. Diğerlerine gönder
    });

    // Tahtayı temizle komutu geldiğinde:
    socket.on('clear', () => {
        drawingHistory = [];       // 1. RAM'i sıfırla
        saveToDisk();              // 2. Diski sıfırla
        socket.broadcast.emit('clear'); // 3. Diğer ekranları temizle
    });

    socket.on('disconnect', () => {
        console.log(`Kullanici ayrildi: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Kalici Hafizali Whiteboard calisiyor: http://localhost:${PORT}`);
});