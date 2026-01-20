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

    // 4. ¿Ya ha sido usado?
    // Esto es CRÍTICO para evitar que alguien use el mismo código dos veces.
    isUsed: {
        type: Boolean,
        default: false
    },

    // 5. ¿Quién lo usó y cuándo? (Relleno solo cuando se usa)
    usedBy: {
        ip: { type: String }, // Guardamos la IP por seguridad (auditoría)
        date: { type: Date }  // Fecha y hora exacta del canje
    }
});

module.exports = mongoose.model('Code', CodeSchema);
