const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Configurar Nodemailer para envío de emails
const emailTransporter = nodemailer.createTransport({
    service: 'gmail', // O el servicio que uses (ej: 'outlook', 'yahoo')
    auth: {
        user: process.env.EMAIL_USER, // Tu email
        pass: process.env.EMAIL_PASS  // Contraseña o app password
    }
});

// Verificar conexión de email al iniciar
emailTransporter.verify((error, success) => {
    if (error) {
        logger.error('Error en configuración de email:', error);
    } else {
        logger.info('Servidor de email listo para enviar mensajes');
    }
});

// Configurar Winston para logging avanzado
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

// --- 1. Seguridad y Configuración Básica ---

// Helmet: "Casco" de seguridad para proteger cabeceras HTTP
app.use(helmet());

// CORS: Permite que tu frontend (web) hable con este backend
// Usa FRONTEND_URL en el .env para restringir el origen (ej: https://tusitio.com)
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const corsOptions = FRONTEND_URL === '*' ? {} : { origin: FRONTEND_URL, optionsSuccessStatus: 200 };
app.use(cors(corsOptions));

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
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
    .then(() => logger.info('✅ Conectado a MongoDB Atlas'))
    .catch(err => logger.error('❌ Error conexión Mongo:', err));

// --- 3. Rutas (Endpoints) ---
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Backend de La Casera Mundial 2026 Operativo 🚀');
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
    logger.error('Error no manejado:', { error: err.message, stack: err.stack, url: req.url, ip: req.ip });
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// --- 4. Arrancar el Servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Servidor escuchando en el puerto ${PORT}`);
});

module.exports = { app, emailTransporter };
