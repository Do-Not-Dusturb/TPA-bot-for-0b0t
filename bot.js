const mineflayer = require('mineflayer');
const { Client, GatewayIntentBits } = require('discord.js');
const readline = require('readline');

// === CONFIGURE HERE ===
const config = {
  mc: {
    host: '0b0t.org',
    port: 25565,
    username: 'ExampleEmail@gmail.com', // email account is registerd with
    auth: 'microsoft',
    allowedUuids: [
      'da938cb6-af2c-4c45-affb-21ayd639765eb', // example
      'cd03aee1-4396-46a5-8c3b-9f41d2cbbdb7c', //example
    ]
  },
  discord: {
    token: 'MTQxO32T2132ggggMyMDg2MTc1MT33Y0NDMhhwMw.GVj22r8s.mKYWffsPkrt3PgHuJksisadrnrxkMazJ2d44i1K3NdBsrM',      // example discord token
    channelId: '14298334112815937587'  // example channel ID
  }
};

// === HELPERS ===
function log(msg) {
  console.log(`[BOT] ${msg}`);
}

let bot;
let client;

// === START MINECRAFT BOT ===
function startBot() {
  bot = mineflayer.createBot({
    host: config.mc.host,
    port: config.mc.port,
    username: config.mc.username,
    auth: config.mc.auth
  });

  bot.once('spawn', () => {
    log(`MC bot spawned as ${bot.username} (uuid: ${bot.uuid})`);
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    log(`<${username}> ${message}`);
    sendToDiscord(`**${username}:** ${message}`);
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

        if (senderUuid && config.mc.allowedUuids.includes(senderUuid)) {
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
    log(`Kicked: ${reason.toString()}`);
    reconnect();
  });

  bot.on('error', (err) => {
    log(`Error: ${err.message}`);
  });

  bot.on('end', () => {
    log('Bot disconnected from server.');
    reconnect();
  });
}

// === RECONNECT HANDLER ===
function reconnect() {
  log('Reconnecting in 5s...');
  setTimeout(startBot, 5000);
}

// === START DISCORD BOT ===
function startDiscord() {
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once('ready', () => {
    log(`Discord bot logged in as ${client.user.tag}`);
  });

  client.on('messageCreate', (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id === config.discord.channelId && bot) {
      const text = `<${msg.author.username}> ${msg.content}`;
      log(`[DISCORD] ${text}`);
      bot.chat(text);
    }
  });

  client.login(config.discord.token);
}

function sendToDiscord(message) {
  if (!client) return;
  const channel = client.channels.cache.get(config.discord.channelId);
  if (channel) {
    channel.send(message).catch(err => log(`Discord send error: ${err.message}`));
  }
}

// === CONSOLE CHAT ===
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  if (bot && bot.chat) {
    bot.chat(line);
    log(`<You> ${line}`);
  } else {
    log('Bot not connected yet, wait...');
  }
});

// === START BOTH ===
startBot();
startDiscord();
