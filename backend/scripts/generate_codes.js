const mongoose = require('mongoose');
const Code = require('../models/Code');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuración
const TOTAL_CODES = 900000;
const BATCH_SIZE = 10000; // Guardaremos de 10.000 en 10.000 para no saturar
const CODE_LENGTH = 8;    // Longitud del código (ej: A1B2C3D4)

// Generador de un solo código aleatorio
function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function startFactory() {
    console.log('🏭 Iniciando la FÁBRICA DE CÓDIGOS...');

    // 1. Conectar a la Base de Datos
    // Nota: Esto fallará si no has puesto la URL real en .env, pero el código es correcto.
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a la Base de Datos');
    } catch (err) {
        console.error('❌ Error conectando a BBDD:', err);
        process.exit(1);
    }

    // 2. Generar Códigos
    console.log(`🚀 Vamos a cocinar ${TOTAL_CODES} códigos. Prepárate.`);

    let count = 0;
    let batch = [];
    // Usamos un Set para asegurar que no haya duplicados en memoria antes de guardar
    const generatedSet = new Set();

    while (generatedSet.size < TOTAL_CODES) {
        const newCode = generateRandomCode(CODE_LENGTH);

        // Si no existe, lo añadimos
        if (!generatedSet.has(newCode)) {
            generatedSet.add(newCode);

            // Creamos el objeto para guardar
            batch.push({
                code: newCode,
                isPrize: false, // Por defecto no tienen premio (luego asignamos los premios)
                isUsed: false
            });

            // Si el lote está lleno, lo mandamos a la BBDD
            if (batch.length === BATCH_SIZE) {
                await Code.insertMany(batch);
                count += BATCH_SIZE;
                console.log(`💾 Guardados ${count} códigos...`);
                batch = []; // Vaciamos el lote
            }
        }
    }

    // Guardar los últimos que hayan sobrado (si no llegan a 10.000)
    if (batch.length > 0) {
        await Code.insertMany(batch);
        console.log(`💾 Guardados los últimos ${batch.length} códigos.`);
    }

    console.log('🎉 ¡Misión Cumplida! 900.000 códigos listos para el Mundial.');
    process.exit(0);
}

startFactory();
