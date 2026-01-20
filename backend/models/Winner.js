const mongoose = require('mongoose');

// Esquema para guardar a los ganadores.
// Separamos esto de los códigos para mantener limpios los datos personales.

const WinnerSchema = new mongoose.Schema({
    // Datos personales del formulario
    nombre: { type: String, required: true },
    email: { type: String, required: true },
    telefono: { type: String },
    direccion: { type: String }, // Para enviar el premio

    // Relación con el código que usó
    winningCode: { type: String, required: true },
    prizeWon: { type: String, required: true }, // Qué ganó

    // Fecha del registro
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Winner', WinnerSchema);
