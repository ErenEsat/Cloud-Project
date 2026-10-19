const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const sizePicker = document.getElementById('sizePicker');
const clearBtn = document.getElementById('clearBtn');

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// İki nokta arasına çizgi çeken ana fonksiyonumuz
function drawLine(x0, y0, x1, y1, color, size) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round'; // Çizgi uçlarını yuvarlatır, kırık görünümü engeller
    ctx.stroke();
    ctx.closePath();
}

// Fareye basıldığında çizimi başlat
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

// Fare hareket ettikçe önceki nokta ile yeni nokta arasına çizgi çek
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    const currentX = e.offsetX;
    const currentY = e.offsetY;
    const color = colorPicker.value;
    const size = sizePicker.value;

    drawLine(lastX, lastY, currentX, currentY, color, size);

    // Yeni başlangıç noktamız artık şu anki noktamız
    lastX = currentX;
    lastY = currentY;
});

// Fare bırakıldığında veya canvas dışına çıktığında çizimi durdur
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// Temizle butonu
clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});