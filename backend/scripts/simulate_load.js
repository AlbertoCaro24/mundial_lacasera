// Script de simulación de carga nativo (sin dependencias externas)
// Como es un script de prueba local, usaremos http nativo si no queremos instalar dependencias extra, 
// o asumimos que se instalarán. Para asegurar que funcione "out of the box" con Node moderno:

const http = require('http');

const SIMULATED_USERS = 500; // Número de usuarios simultáneos
const TOTAL_REQUESTS = 2000; // Total de peticiones a lanzar
const API_URL = 'http://localhost:3000/api/check-code';

console.log(`🔥 INICIANDO SIMULACIÓN DE CARGA (REAL STRESS TEST)`);
console.log(`👥 Usuarios Simulados: ${SIMULATED_USERS}`);
console.log(`📨 Peticiones Totales: ${TOTAL_REQUESTS}`);
console.log('--------------------------------------------------');

let successful = 0;
let errors = 0;
let rateLimited = 0;
let completed = 0;
const startTime = Date.now();

function randomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
}

function makeRequest(id) {
    const code = randomCode();
    const data = JSON.stringify({ code });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/check-code',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                successful++;
            } else if (res.statusCode === 429) {
                // 429 es "Too Many Requests" -> El rate limiter funcionó
                rateLimited++;
            } else {
                errors++;
            }
            checkDone();
        });
    });

    req.on('error', (e) => {
        errors++;
        checkDone();
    });

    req.write(data);
    req.end();
}

function checkDone() {
    completed++;
    if (completed >= TOTAL_REQUESTS) {
        printResults();
    }
}

function printResults() {
    const duration = (Date.now() - startTime) / 1000;
    console.log('\n--------------------------------------------------');
    console.log(`🏁 SIMULACIÓN FINALIZADA en ${duration} segundos`);
    console.log(`✅ Peticiones Exitosas: ${successful}`);
    console.log(`🛡️ Bloqueadas por Seguridad (Rate Limit): ${rateLimited}`);
    console.log(`❌ Errores del Servidor: ${errors}`);
    console.log(`⚡ Rendimiento: ${(TOTAL_REQUESTS / duration).toFixed(2)} req/seg`);

    if (errors === 0) {
        console.log('\n🟢 RESULTADO: EL SERVIDOR ES ROBUSTO.');
        if (rateLimited > 0) {
            console.log('🛡️ El sistema de defensa anti-buseros (Rate Limit) está funcionando.');
        }
    } else {
        console.log('\n🔴 RESULTADO: EL SERVIDOR SUFRIÓ ERRORES. REVISAR LOGS.');
    }
}

// Lanzar las hordas
for (let i = 0; i < TOTAL_REQUESTS; i++) {
    // Pequeño delay aleatorio para simular tráfico "humano" pero intenso
    setTimeout(() => makeRequest(i), Math.random() * 5000);
}
