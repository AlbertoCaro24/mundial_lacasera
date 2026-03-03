const express = require('express');
const router = express.Router();
const Code = require('../models/Code');
const Winner = require('../models/Winner');
const winston = require('winston');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar Nodemailer
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
        if (foundCode.used && foundCode.result !== 'PENDING') {
            return res.json({
                success: false,
                message: "Este código ya ha sido canjeado o está siendo procesado."
            });
        }

        // SI ES LA PRIMERA VEZ: Lo marcamos como usado (sea premiado o no) para evitar re-usos en el futuro
        if (!foundCode.used) {
            foundCode.used = true;
            foundCode.usedAt = new Date();
            foundCode.ip = req.ip;
            foundCode.userAgent = req.get('User-Agent') || '';
            // Si tiene premio, queda PENDIENTE de que el usuario envíe sus datos en premio.html. Si no, LOSE directo.
            foundCode.result = foundCode.isPrize ? 'PENDING' : 'LOSE';
            await foundCode.save();
        }

        // CASO C: Devolvemos si tiene premio o no
        winston.info('Código validado', { code: cleanCode, isPrize: foundCode.isPrize, prizeType: foundCode.prizeType, ip: req.ip });
        return res.json({
            success: true,
            isPrize: foundCode.isPrize,
            prizeType: foundCode.prizeType // "camiseta", "balon" o null
        });

    } catch (error) {
        winston.error("Error al verificar código:", { error: error.message, code: req.body.code, ip: req.ip });
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
        // Generamos un _id para el posible ganador y reservamos el código en una sola operación.
        const mongoose = require('mongoose');
        const winnerId = new mongoose.Types.ObjectId();

        const codeDoc = await Code.findOneAndUpdate(
            { code: cleanCode, result: 'PENDING' }, // Filtro: ahora buscaremos aquellos que quedaron pendientes tras /check-code
            {
                $set: {
                    userId: winnerId,
                    ip: req.ip, // Guardamos la IP definitiva en el momento del registro también
                    userAgent: req.get('User-Agent') || '',
                    // Dejamos en result: PENDING temporalmente, se pasa a WIN al final
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

        // Aquí decidimos si es premiado o no según el campo existente `isPrize`
        if (!codeDoc.isPrize) {
            // Código válido pero sin premio -> marcamos como 'LOSE' y devolvemos error claro
            await Code.findByIdAndUpdate(codeDoc._id, { $set: { result: 'LOSE' } });
            return res.status(400).json({ success: false, message: 'Este código no tiene premio.' });
        }

        // Código tiene premio: creamos el ganador con el _id reservado previamente
        const newWinner = new Winner({
            _id: codeDoc.userId, // usamos el _id reservado
            nombre,
            apellidos,
            email,
            telefono,
            ciudad: req.body.ciudad, // El formulario envía la ciudad
            direccion,
            winningCode: cleanCode,
            prizeWon: codeDoc.prizeType,
            ip: req.ip,
            userAgent: req.get('User-Agent') || ''
        });

        await newWinner.save();

        // Actualizamos el código con resultado definitivo
        await Code.findByIdAndUpdate(codeDoc._id, { $set: { result: 'WIN' } });

        // Enviar email de confirmación al ganador en SEGUNDO PLANO (sin await)
        // para que la interfaz del usuario responda inmediatamente sin quedarse "pensando"
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: '¡Enhorabuena! Tu premio de La Casera Mundial 2026',
                html: `
                    <h1>¡Felicidades, ${nombre} ${apellidos}!</h1>
                    <p>Has ganado: <strong>${codeDoc.prizeType}</strong></p>
                    <p>Tu código premiado fue: <strong>${cleanCode}</strong></p>
                    <p>Recibirás tu premio en la dirección proporcionada en los próximos días.</p>
                    <p>Gracias por participar en la promoción de La Casera Mundial 2026.</p>
                    <br>
                    <p>Atentamente,<br>Equipo de La Casera</p>
                `
            };

            emailTransporter.sendMail(mailOptions).then(() => {
                winston.info(`📧 Email de confirmación enviado a ${email}`);
            }).catch((emailError) => {
                winston.error('Error enviando email en 2º plano:', emailError);
            });

        } catch (syncError) {
            winston.error('Error síncrono configurando email:', syncError);
        }

        winston.info(`🎉 ¡Nuevo ganador registrado! ${nombre} ${apellidos} ganó ${codeDoc.prizeType}`, { code: cleanCode, nombre, apellidos, email, ip: req.ip });

        // 4. Responder con éxito
        return res.json({
            success: true,
            message: "¡Premio canjeado correctamente!",
            prize: codeDoc.prizeType
        });

    } catch (error) {
        winston.error("Error al registrar ganador:", { error: error.message, code: cleanCode, ip: req.ip });
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
        let csv = "Nombre,Apellidos,Email,Telefono,Ciudad,Direccion,Premio,Codigo,Fecha,IP,Navegador\n";

        // Filas
        winners.forEach(w => {
            // Limpiamos comas o saltos de línea para que no rompan el Excel
            const clean = (text) => text ? `"${text.toString().replace(/"/g, '""')}"` : "";

            const fecha = w.createdAt ? w.createdAt.toISOString().split('T')[0] : "";

            csv += `${clean(w.nombre)},${clean(w.apellidos)},${clean(w.email)},${clean(w.telefono)},${clean(w.ciudad)},${clean(w.direccion)},${clean(w.prizeWon)},${clean(w.winningCode)},${fecha},${clean(w.ip)},${clean(w.userAgent)}\n`;
        });

        // 4. Enviar el archivo
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="ganadores_lacasera.csv"');
        res.send(csv);

    } catch (error) {
        winston.error("Error al generar CSV:", { error: error.message, ip: req.ip });
        res.status(500).send("Error generando el archivo");
    }
});

module.exports = router;
