const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// --- 1. Seguridad y Configuración Básica ---

// Helmet: "Casco" de seguridad para proteger cabeceras HTTP
app.use(helmet());

// CORS: Permite que tu frontend (web) hable con este backend
app.use(cors());

// JSON: Entender datos que vienen en formato JSON
app.use(express.json());

// Rate Limiting: Evitar ataques de fuerza bruta (máx 100 peticiones por 15 min por IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Demasiadas peticiones desde esta IP, por favor intenta de nuevo en 15 minutos."
});
app.use('/api/', limiter);

// --- 2. Base de Datos (MongoDB) ---
// --- 2. Base de Datos (MongoDB) ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error conexión Mongo:', err));

// --- 3. Rutas (Endpoints) ---
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Backend de La Casera Mundial 2026 Operativo 🚀');
});

// --- 4. Arrancar el Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = app;
