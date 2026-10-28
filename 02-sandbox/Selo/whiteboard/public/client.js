const socket = io();

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

function drawLine(x0, y0, x1, y1, color, size, emit) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    socket.emit('draw', {
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1,
        color: color,
        size: size
    });
}

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const currentX = e.offsetX;
    const currentY = e.offsetY;

    // OPTIMIZASYON: Fare eski noktadan en az 4 piksel uzaklaşmadıysa kaydetme!
    const distance = Math.hypot(currentX - lastX, currentY - lastY);
    if (distance < 4) return;

    const color = colorPicker.value;
    const size = sizePicker.value;

    drawLine(lastX, lastY, currentX, currentY, color, size, true);

    lastX = currentX;
    lastY = currentY;
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
});

// --- SUNUCUDAN GELEN CANLI OLAYLAR ---

// AŞAMA 3: Sayfa ilk açıldığında sunucudaki tüm geçmiş çizimleri ekrana bas
socket.on('init_board', (history) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history.forEach((item) => {
        drawLine(item.x0, item.y0, item.x1, item.y1, item.color, item.size, false);
    });
});

socket.on('draw', (data) => {
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
});

socket.on('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});