const mongoose = require('mongoose');
const Code = require('../models/Code');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PRIZES_TO_GIVE = 50; // Vamos a crear 50 ganadores ahora mismo

async function assignPrizes() {
    console.log('🎰 Lotería en marcha... Asignando premios...');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Buscar códigos que NO tengan premio y NO estén usados
        // Usamos $sample para coger aleatorios
        const randomCodes = await Code.aggregate([
            { $match: { isPrize: false, isUsed: false } },
            { $sample: { size: PRIZES_TO_GIVE } }
        ]);

        if (randomCodes.length === 0) {
            console.log('No encontré códigos disponibles.');
            process.exit(0);
        }

        console.log(`Encontrados ${randomCodes.length} candidatos.`);

        // 2. Actualizarlos para que sean ganadores
        const premios = ['Camiseta Oficial', 'Balón Oficial', 'Viaje a la Final'];

        for (let codeDoc of randomCodes) {
            const randomPrize = premios[Math.floor(Math.random() * premios.length)];

            await Code.updateOne(
                { _id: codeDoc._id },
                {
                    $set: {
                        isPrize: true,
                        prizeType: randomPrize
                    }
                }
            );

            // Imprimir algunos para el usuario
            console.log(`✨ CÓDIGO GANADOR CREADO: ${codeDoc.code} -> Premio: ${randomPrize}`);
        }

        console.log('✅ Premios repartidos correctamente.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

assignPrizes();
