const mineflayer = require('mineflayer');
const readline = require('readline');

// === CONFIGURE HERE ===
const config = {
  host: '0b0t.org', // server address or IP
  port: 25565,              // server port
  username: 'email', // Microsoft email OR username (if offline)
  auth: 'microsoft',        // 'microsoft' (premium) or 'offline' (cracked server)
  allowedUuids: [
    // Add UUIDs of players who can auto-tpa
    'da938cb6-af2c-4c45-affb-21ad639765eb', // sleepy
    'cd03aee1-4396-46a5-8c3b-9f1d2cbbdb7c', // elvis
    '9cb5f569-6f3d-4dcd-8135-85f04acb36e6', // socio
    '1125d142-161e-4868-98c5-172020b244d2', // King_Hades_
    'a2a1738d-b327-4334-abd5-2ee177069a20', // skobos
    'ee0f6c25-6280-41fe-be0d-29099e1ae6e8', // Kuskowim
    '2caa9319-a609-4ee5-aa88-24c4e49bb567', // v0ee  
    
  ]
};

// === CREATE BOT ===
const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  auth: config.auth
});

// === HELPERS ===
function log(msg) {
  console.log(`[BOT] ${msg}`);
}

// === EVENTS ===
bot.once('spawn', () => {
  log(`Bot spawned as ${bot.username} (uuid: ${bot.uuid})`);
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return; // ignore self
  log(`<${username}> ${message}`);
});

bot.on('message', (jsonMsg) => {
  const msg = jsonMsg.toString();
  log(msg);

  // Detect teleport request messages
  if (msg.includes('wants to teleport to you')) {
    const match = msg.match(/^(\w+)\s+wants to teleport to you/);
    if (match) {
      const username = match[1];
      const player = bot.players[username];
      const senderUuid = player && player.uuid ? player.uuid : null;

      log(`TPA request detected from ${username} (uuid=${senderUuid || 'unknown'})`);

      if (senderUuid && config.allowedUuids.includes(senderUuid)) {
        log(`Auto-accepting TPA from ${username}`);
        bot.chat(`/tpy ${username}`);
      } else {
        log(`Auto-denying TPA from ${username}`);
        bot.chat(`/tpdeny ${username}`);
      }
    }
  }
});

bot.on('kicked', (reason) => {
  log(`Kicked: ${reason}`);
});

bot.on('error', (err) => {
  log(`Error: ${err.message}`);
});

// === CONSOLE CHAT ===
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  if (line.startsWith('/')) {
    bot.chat(line); // send raw command
    log(`> Sent: ${line}`);
  } else {
    bot.chat(line); // normal chat
    log(`<You> ${line}`);
  }
});
