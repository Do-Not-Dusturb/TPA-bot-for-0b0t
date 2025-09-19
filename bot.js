const mineflayer = require('mineflayer');
const readline = require('readline');


const config = {
  host: '0b0t.org', // server address or IP
  port: 25565,              // server port (default)
  username: 'exampleemail@outlook.com', // Type email you have your mc account on but if you want to use for cracked just type the username u want it
  auth: 'microsoft',        // 'microsoft' (real account) or 'offline' (cracked server)
  allowedUuids: [
    // add the FULL NOT TRIMMED, UUIDs of players you want to auto /tpaccept MAKE SURE YOU INCLUDE THE ' BEFORE AND AFTER!!!!
    '11111111-2222-3333-4444-555555555555' // example uuid
    '22222222-5555-7777-8888-999999999999' // example uuid
  ]
};

// spawn bot in etc
const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  auth: config.auth
});

// log helper etc etc
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
    // just makes what you see the bot name as on console
    bot.chat(line);
    log(`<You> ${line}`);
  }
});

// made by Do-Not-Dusturb :O using mineflayer.
