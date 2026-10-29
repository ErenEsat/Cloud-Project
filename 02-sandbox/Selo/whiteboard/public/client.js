const socket = io();

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');
const roomInput = document.getElementById('roomInput');
const roomBtn = document.getElementById('roomBtn');

// URL'den oda adını bul (/oda/matematik -> "matematik", yoksa "genel")
const pathParts = window.location.pathname.split('/');
const currentRoom = (pathParts[1] === 'oda' && pathParts[2]) ? decodeURIComponent(pathParts[2]) : 'genel';
roomInput.value = currentRoom;

// Odaya geçiş butonu
roomBtn.addEventListener('click', () => {
    const targetRoom = roomInput.value.trim().toLowerCase() || 'genel';
    window.location.href = `/oda/${encodeURIComponent(targetRoom)}`;
});

// Sunucuya bağlandığında odaya katıl
socket.on('connect', () => {
    socket.emit('join_room', currentRoom);
});

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Hem bilgisayar faresi hem telefon ekranı için tam ölçekli koordinat hesaplayıcı
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

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

    socket.emit('draw', { x0, y0, x1, y1, color, size });
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
}

function moveDrawing(e) {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();

    const pos = getPos(e);
    const distance = Math.hypot(pos.x - lastX, pos.y - lastY);
    if (distance < 4) return;

    drawLine(lastX, lastY, pos.x, pos.y, colorPicker.value, sizePicker.value, true);
    lastX = pos.x;
    lastY = pos.y;
}

function stopDrawing() {
    isDrawing = false;
}

// Bilgisayar Fare Olayları
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', moveDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Telefon Dokunmatik Olayları
canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', moveDrawing, { passive: false });
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
});

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