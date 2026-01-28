const https = require('https');

const DOMAIN = "spencergreenhotel.com";
const BASE_PATH = "/api";

function request(method, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: DOMAIN,
            path: path,
            method: method,
            headers: {
                'User-Agent': 'SimulationScript/1.0'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`\n${method} https://${DOMAIN}${path} -> Status: ${res.statusCode}`);
            console.log('Headers:', res.headers);

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (data.length < 500) console.log('Body:', data);
                else console.log('Body: (too long)');
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            resolve(0);
        });
        req.end();
    });
}

async function debug() {
    console.log("🔍 Starting connectivity check...");

    // 1. Check Root
    await request('GET', '/api');

    // 2. Check Analytics Option (CORS preflight)
    await request('OPTIONS', '/api/analytics/track');

    // 3. Try POST
    await request('POST', '/api/analytics/track?page=%2Ftest');
}

debug();
