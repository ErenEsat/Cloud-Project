const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002; // Senin projenin portu

// 'public' klasöründeki HTML, CSS ve JS dosyalarını tarayıcıya sun
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Whiteboard sunucusu calisiyor: http://localhost:${PORT}`);
});