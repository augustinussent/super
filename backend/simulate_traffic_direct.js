const https = require('https');

// DIRECT BACKEND URL
const API_HOST = "spensmer-backend.onrender.com";
const API_PATH = "/api/analytics/track";

console.log(`🚀 Starting traffic simulation DIRECTLY to https://${API_HOST}${API_PATH}...`);

function request(page) {
    return new Promise((resolve) => {
        const urlStr = `https://${API_HOST}${API_PATH}?page=${encodeURIComponent(page)}`;

        const options = {
            method: 'POST',
            headers: {
                'Content-Length': 0,
                // Simulate origin to check if backend accepts it (though CORS is browser-enforced)
                'Origin': 'https://spencergreenhotel.com'
            }
        };

        const req = https.request(urlStr, options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log(`✅ Visited ${page} (${res.statusCode})`);
            } else {
                console.log(`❌ Failed ${page} (${res.statusCode})`);
                // Print body if error
                res.on('data', d => process.stdout.write(d));
            }
            resolve();
        });

        req.on('error', (e) => {
            console.error(`❌ Error visiting ${page}: ${e.message}`);
            resolve();
        });

        req.end();
    });
}

async function simulate() {
    const pages = ['/', '/rooms', '/contact', '/dining', '/rooms/deluxe'];

    for (const p of pages) {
        await request(p);
        await new Promise(r => setTimeout(r, 200));
    }

    console.log("\n✨ Simulation complete!");
}

simulate();
