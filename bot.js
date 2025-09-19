const mineflayer = require('mineflayer');
const readline = require('readline');


const config = {
  host: '0b0t.org', // server address or IP
  port: 25565,              // server port
  username: 'do_not_dusturb@outlook.com', // if auth:microsoft, can be your email; if offline, just the username
  auth: 'microsoft',        // 'microsoft' (real account) or 'offline' (cracked server)
  allowedUuids: [
    // add the UUIDs of players you want to auto /tpaccept
    '11111111-2222-3333-4444-555555555555'
  ]
};


const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  auth: config.auth
});

// log helper
function log(msg) {
  console.log(`[BOT] ${msg}`);
}


bot.once('spawn', () => {
  log(`Bot spawned as ${bot.username} (uuid: ${bot.uuid})`);
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return; // ignore itself
  const parts = message.trim().toLowerCase().split(/\s+/);
  if ((parts[0] === '/tpa' || parts[0] === 'tpa') && parts[1]) {
    const target = parts[1];
    if (target.toLowerCase() === bot.username.toLowerCase()) {
      const player = bot.players[username];
      const senderUuid = player && player.uuid ? player.uuid : null;

      log(`TPA request from ${username} (uuid=${senderUuid || 'unknown'})`);
      if (senderUuid && config.allowedUuids.includes(senderUuid)) {
        log(`Auto-accepting tpa from ${username}`);
        bot.chat('/tpaccept');
      } else {
        log(`Auto-denying tpa from ${username}`);
        bot.chat('/tpdeny');
      }
    }
  }
});

bot.on('message', (jsonMsg) => {
  log(jsonMsg.toString());
});

bot.on('kicked', (reason) => {
  log(`Kicked: ${reason}`);
});

bot.on('error', (err) => {
  log(`Error: ${err.message}`);
});


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  if (line.startsWith('/')) {
    
    bot.chat(line);
    log(`> Sent: ${line}`);
  } else {
    // normal chat
    bot.chat(line);
    log(`<You> ${line}`);
  }
});
