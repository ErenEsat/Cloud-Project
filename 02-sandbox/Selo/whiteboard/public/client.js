// Sunucuyla WebSocket bağlantısını başlat
const socket = io();

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// emit parametresi: Bu çizgi sunucuya gönderilsin mi?
function drawLine(x0, y0, x1, y1, color, size, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    // Eğer başkasından gelen bir çizimse tekrar sunucuya gönderme!
    if (!emit) return;

    // Kendi çizimimizse JSON olarak sunucuya fırlat
    socket.emit('draw', {
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1,
        color: color,
        size: size
    });
}

// --- YEREL FARE OLAYLARI ---
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const currentX = e.offsetX;
    const currentY = e.offsetY;
    const color = colorPicker.value;
    const size = sizePicker.value;

    // Kendi faremizle çizdiğimiz için son parametre 'true' (sunucuya gönder)
    drawLine(lastX, lastY, currentX, currentY, color, size, true);

    lastX = currentX;
    lastY = currentY;
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// Temizle butonuna basıldığında hem kendi ekranını sil hem sunucuya haber ver
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
});

// --- SUNUCUDAN GELEN CANLI OLAYLAR ---

// Başka bir kullanıcı çizgi çizdiğinde:
socket.on('draw', (data) => {
    // Son parametre 'false' çünkü bu veri zaten sunucudan geldi
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
});

// Başka bir kullanıcı tahtayı temizlediğinde:
socket.on('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});