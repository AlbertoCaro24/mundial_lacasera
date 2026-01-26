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
        const { code, nombre, apellidos, email, telefono, direccion } = req.body;
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
            apellidos,
            email,
            telefono,
            direccion,
            winningCode: cleanCode,
            prizeWon: codeDoc.prizeType
        });

        await newWinner.save();

        console.log(`🎉 ¡Nuevo ganador registrado! ${nombre} ${apellidos} ganó ${codeDoc.prizeType}`);

        // 4. Responder con éxito
        return res.json({
            success: true,
            message: "¡Premio canjeado correctamente!",
            prize: codeDoc.prizeType
        });

    } catch (error) {
        console.error("Error al registrar ganador:", error);
        // Si falló guardar el ganador pero el código se marcó usado, habría que    // Si falló guardar el ganador...
        res.status(500).json({ success: false, message: "Error al procesar el premio." });
    }
});

/**
 * 📥 RUTA 3: DESCARGAR GANADORES (EXCEL/CSV)
 * URL: GET /api/descargar-ganadores?clave=ADMIN_SECRETO
 */
router.get('/descargar-ganadores', async (req, res) => {
    try {
        // 1. Candado de seguridad básico
        if (req.query.clave !== 'ADMIN_LACASERA_2026') {
            return res.status(403).send("⛔ Acceso denegado. Te falta la clave secreta.");
        }

        // 2. Buscar todos los ganadores
        const winners = await Winner.find().sort({ createdAt: -1 });

        // 3. Crear el CSV (manual para no instalar más librerías)
        // Cabeceras
        let csv = "Nombre,Apellidos,Email,Telefono,Direccion,Premio,Codigo,Fecha\n";

        // Filas
        winners.forEach(w => {
            // Limpiamos comas o saltos de línea para que no rompan el Excel
            const clean = (text) => text ? `"${text.toString().replace(/"/g, '""')}"` : "";

            const fecha = w.createdAt ? w.createdAt.toISOString().split('T')[0] : "";

            csv += `${clean(w.nombre)},${clean(w.apellidos)},${clean(w.email)},${clean(w.telefono)},${clean(w.direccion)},${clean(w.prizeWon)},${clean(w.winningCode)},${fecha}\n`;
        });

        // 4. Enviar el archivo
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="ganadores_lacasera.csv"');
        res.send(csv);

    } catch (error) {
        console.error("Error al generar CSV:", error);
        res.status(500).send("Error generando el archivo");
    }
});

module.exports = router;
