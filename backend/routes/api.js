const express = require('express');
const router = express.Router();
const Code = require('../models/Code');
const Winner = require('../models/Winner');

/**
 * 🕵️‍♀️ RUTA 1: VERIFICAR CÓDIGO
 * La web envía un código, nosotros decimos si es válido y si tiene premio.
 * URL: POST /api/check-code
 * Body: { "code": "A1B2C3D4" }
 */
router.post('/check-code', async (req, res) => {
    try {
        const { code } = req.body;

        // 1. Limpieza básica (quitar espacios, mayúsculas)
        const cleanCode = code ? code.trim().toUpperCase() : '';

        if (!cleanCode) {
            return res.status(400).json({ success: false, message: "Falta el código" });
        }

        // 2. Buscar en la Base de Datos
        const foundCode = await Code.findOne({ code: cleanCode });

        // 3. Casos posibles:

        // CASO A: El código no existe
        if (!foundCode) {
            return res.json({
                success: false,
                message: "Código no válido. Revísalo bien."
            });
        }

        // CASO B: El código ya se usó (¡Alerta de pillo!)
        if (foundCode.isUsed) {
            return res.json({
                success: false,
                message: "Este código ya ha sido canjeado."
            });
        }

        // CASO C: Código válido y sin usar
        // Devolvemos si tiene premio o no
        return res.json({
            success: true,
            isPrize: foundCode.isPrize,
            prizeType: foundCode.prizeType // "camiseta", "balon" o null
        });

    } catch (error) {
        console.error("Error al verificar código:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

/**
 * 🏆 RUTA 2: RECLAMAR PREMIO
 * Cuando el usuario ve que ganó y rellena sus datos.
 * URL: POST /api/register-winner
 * Body: { "code": "...", "nombre": "...", "email": "...", ... }
 */
router.post('/register-winner', async (req, res) => {
    try {
        const { code, nombre, email, telefono, direccion } = req.body;
        const cleanCode = code ? code.trim().toUpperCase() : '';

        // 1. Validación de seguridad CRÍTICA: "Atomicidad"
        // Buscamos el código Y verificamos que esté 'isUsed: false' EN LA MISMA ORDEN.
        // Si alguien lo canjeó hace 1 milisegundo, esta operación fallará.
        const codeDoc = await Code.findOneAndUpdate(
            { code: cleanCode, isUsed: false }, // Filtro: debe existir y NO estar usado
            {
                $set: {
                    isUsed: true,
                    "usedBy.ip": req.ip,
                    "usedBy.date": new Date()
                }
            },
            { new: true } // Devuelve el documento actualizado
        );

        // Si codeDoc es null, significa que o no existe o YA ESTABA USADO.
        if (!codeDoc) {
            return res.status(400).json({
                success: false,
                message: "Error: El código no es válido o ya ha sido utilizado."
            });
        }

        // 2. Verificar que REALMENTE tenía premio (doble check de seguridad)
        if (!codeDoc.isPrize) {
            // Esto sería raro si el frontend funciona bien, pero por seguridad...
            return res.status(400).json({
                success: false,
                message: "Este código no tiene premio."
            });
        }

        // 3. Guardar al Ganador
        const newWinner = new Winner({
            nombre,
            email,
            telefono,
            direccion,
            winningCode: cleanCode,
            prizeWon: codeDoc.prizeType
        });

        await newWinner.save();

        console.log(`🎉 ¡Nuevo ganador registrado! ${nombre} ganó ${codeDoc.prizeType}`);

        // 4. Responder con éxito
        return res.json({
            success: true,
            message: "¡Premio canjeado correctamente!",
            prize: codeDoc.prizeType
        });

    } catch (error) {
        console.error("Error al registrar ganador:", error);
        // Si falló guardar el ganador pero el código se marcó usado, habría que hacer rollback manual
        // o usar transacciones de Mongo (disponibles en Atlas). 
        // Para simplificar, asumimos estabilidad de BD aquí, pero en PROD con Atlas usaremos Sessions.
        res.status(500).json({ success: false, message: "Error al procesar el premio." });
    }
});

module.exports = router;
