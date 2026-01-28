const tls = require('tls');

const config = {
    host: "mail.spencergreenhotel.com",
    port: 465,
    user: "reservasi@spencergreenhotel.com",
    pass: "Sp3nc3r@B4tu"
};

console.log(`Connecting to ${config.host}:${config.port} via TLS...`);

const socket = tls.connect(config.port, config.host, { rejectUnauthorized: false }, () => {
    console.log('✅ Connected to server securely!');
    console.log('Waiting for greeting...');
});

socket.setEncoding('utf8');

let phase = 'greeting';

socket.on('data', (data) => {
    console.log(`< ${data.trim()}`);

    // Simple state machine for SMTP login
    if (phase === 'greeting' && data.includes('220')) {
        console.log('> EHLO localhost');
        socket.write('EHLO localhost\r\n');
        phase = 'ehlo';
    }
    else if (phase === 'ehlo' && data.includes('250 ')) {
        console.log('> AUTH LOGIN');
        socket.write('AUTH LOGIN\r\n');
        phase = 'auth_login';
    }
    else if (phase === 'auth_login' && data.includes('334')) {
        // Username in base64
        const userB64 = Buffer.from(config.user).toString('base64');
        console.log(`> ${userB64} (Username)`);
        socket.write(`${userB64}\r\n`);
        phase = 'auth_user';
    }
    else if (phase === 'auth_user' && data.includes('334')) {
        // Password in base64
        const passB64 = Buffer.from(config.pass).toString('base64');
        console.log(`> [PASSWORD_HIDDEN]`);
        socket.write(`${passB64}\r\n`);
        phase = 'auth_pass';
    }
    else if (phase === 'auth_pass') {
        if (data.includes('235')) {
            console.log('\n✅ Login SUCCESSFUL! Credentials are correct.');
        } else {
            console.log('\n❌ Login FAILED. Check credentials.');
        }
        socket.end();
    }
});

socket.on('error', (err) => {
    console.error(`❌ Connection Error: ${err.message}`);
});

socket.on('end', () => {
    console.log('Connection closed.');
});
