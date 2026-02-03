const mongoose = require('mongoose');

// El Esquema es como el "molde" o "plano" de nuestros datos.
// Aquí definimos qué información guardamos de cada código.

const CodeSchema = new mongoose.Schema({
    // 1. El código en sí (ej: "A1B2C3D4")
    code: {
        type: String,
        required: true,
        unique: true, // ¡Importante! No puede haber dos iguales.
        index: true   // Esto hace que buscar un código entre 900.000 sea instantáneo.
    },

    // 2. ¿Este código tiene premio?
    isPrize: {
        type: Boolean,
        default: false
    },

    // 3. Si tiene premio, ¿qué es? (ej: "camiseta", "balon", o null si no tiene)
    prizeType: {
        type: String,
        default: null
    },

    // 4. Estado de uso (nuevo esquema)
    // Usamos campos más detallados para auditoría y seguimiento
    used: {
        type: Boolean,
        default: false,
        index: true
    },

    usedAt: { type: Date, default: null },

    // Si existe un ganador asociado, referenciamos su _id (puede crearse antes de guardar el ganador)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Winner', default: null },

    // Datos de auditoría
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },

    // Resultado del canje: 'WIN' | 'LOSE' | 'PENDING'
    result: { type: String, enum: ['WIN','LOSE','PENDING'], default: null }
});

module.exports = mongoose.model('Code', CodeSchema);
