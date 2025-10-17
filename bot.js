// Fully working tpa bot for 0b0t created by do-not-dusturb
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { Client, GatewayIntentBits } = require('discord.js');

const config = {
  mc: {
    host: '0b0t.org',
    port: 25565,
    username: 'EMAIL', // Email account is registerd with
    auth: 'microsoft',
    allowedUuids: [
      'UUID1', // UUID slots
      'UUID2'  // UUID slots
    ],
    adminUsers: ['User', 'User', 'User']  // Admin command users
  },
  discord: {
    token: 'DISCORD_TOKEN', // Discord bot token
    channelId: 'CHANNELID'  // ID where bot will work
  }
};

function log(msg) {
  console.log(`[BOT] ${msg}`);
}

// === CHAT QUEUE ===
class ChatQueue {
  constructor(bot, delay = 1200) {
    this.bot = bot;
    this.delay = delay;
    this.queue = [];
    this.sending = false;
  }
  enqueue(text) {
    if (!text) return;
    const chunks = [];
    for (let i = 0; i < text.length; i += 230) chunks.push(text.slice(i, i + 230));
    this.queue.push(...chunks);
    this._process();
  }
  async _process() {
    if (this.sending) return;
    this.sending = true;
    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      try {
        if (this.bot && this.bot.chat) this.bot.chat(msg);
      } catch (err) {
        log(`ChatQueue error: ${err?.message || err}`);
      }
      await new Promise(r => setTimeout(r, this.delay));
    }
    this.sending = false;
  }
}

let bot = null;
let client = null;
let lastTpaRequester = null;

function cleanupOldBotInstance(oldBot) {
  if (!oldBot) return;
  try {
    oldBot.removeAllListeners?.();
    oldBot.quit?.();
    oldBot.end?.();
    oldBot.socket?.end?.();
  } catch (e) {
    log(`Error cleaning old bot: ${e.message}`);
  }
}

// === CREATE BOT & ATTACH EVENTS ===
function createBotAndAttach() {
  return new Promise((resolve, reject) => {
    if (bot) cleanupOldBotInstance(bot);

    const created = mineflayer.createBot({
      host: config.mc.host,
      port: config.mc.port,
      username: config.mc.username,
      auth: config.mc.auth
    });

    const connectTimeout = setTimeout(() => {
      if (!created._spawned) reject(new Error('Connection timeout'));
    }, 20000);

    created.once('spawn', () => {
      clearTimeout(connectTimeout);
      created.loadPlugin(pathfinder);
      created.pathfinder.setMovements(new Movements(created));
      bot = created;
      log(`Bot spawned as ${created.username}`);
      resolve();
    });

    created.on('chat', (username, message) => {
      if (username === created.username) return;
      log(`<${username}> ${message}`);

      // === Minecraft -> Discord relay ===
      client.channels.fetch(config.discord.channelId)
        .then(channel => {
          if (channel)
            channel.send({
              embeds: [{
                color: 0xFF0000,
                author: { name: username, icon_url: `https://mc-heads.net/avatar/${username}` },
                description: message,
                timestamp: new Date()
              }]
            }).catch(err => log(`Discord embed error: ${err.message}`));
        })
        .catch(err => log(`Discord relay error: ${err.message}`));

      // === ADMIN COMMANDS ===
      if (config.mc.adminUsers.includes(username) && message.startsWith(':')) {
        const args = message.slice(1).trim().split(/\s+/);
        const cmd = args.shift()?.toLowerCase();
        (async () => {
          try {
            switch (cmd) {
              case 'help':
                created.chat(`/tell ${username} Commands: :help, :ping, :coords, :say <msg>, :come, :stop, :follow <player>, :tpa <player>, :accept, :deny`);
                break;
              case 'ping':
                created.chat(`/tell ${username} Pong! Latency: ${created.player?.ping ?? 'N/A'}ms`);
                break;
              case 'coords':
                created.chat(`/tell ${username} Pos: ${created.entity?.position}`);
                break;
              case 'say':
                created.chat(args.join(' '));
                break;
              case 'come': {
                const p = created.players[username]?.entity?.position;
                if (p) {
                  created.pathfinder.setGoal(new goals.GoalNear(p.x, p.y, p.z, 1));
                  created.chat(`/tell ${username} Coming.`);
                } else created.chat(`/tell ${username} Can't see you.`);
                break;
              }
              case 'stop':
                created.pathfinder.setGoal(null);
                created.chat(`/tell ${username} Stopping.`);
                break;
              case 'follow': {
                const target = created.players[args[0]];
                if (target?.entity) {
                  created.pathfinder.setGoal(new goals.GoalFollow(target.entity, 2), true);
                  created.chat(`/tell ${username} Following ${args[0]}.`);
                } else created.chat(`/tell ${username} Player not found.`);
                break;
              }
              case 'tpa':
                if (args[0]) created.chat(`/tpa ${args[0]}`);
                break;
              case 'accept':
                if (lastTpaRequester) created.chat(`/tpy ${lastTpaRequester}`);
                break;
              case 'deny':
                if (lastTpaRequester) created.chat(`/tpdeny ${lastTpaRequester}`);
                break;
              default:
                created.chat(`/tell ${username} Unknown command.`);
            }
          } catch (e) {
            created.chat(`/tell ${username} Error: ${e.message}`);
          }
        })();
      }
    });

    created.on('message', msg => {
      const text = msg.toString();
      if (text.includes('wants to teleport to you')) {
        const match = text.match(/^(\w+)\s+wants to teleport to you/);
        if (match) {
          const requester = match[1];
          lastTpaRequester = requester;
          const uuid = created.players[requester]?.uuid;
          if (config.mc.allowedUuids.includes(uuid)) created.chat(`/tpy ${requester}`);
          else created.chat(`/tpdeny ${requester}`);
        }
      }
    });

    created.on('kicked', r => log(`Kicked: ${r}`));
    created.on('end', () => {
      log('Bot disconnected.');
      // === AUTO RECONNECT ===
      setTimeout(async () => {
        log('Attempting to reconnect...');
        try {
          await createBotAndAttach();
          log('Reconnected successfully.');
        } catch (e) {
          log(`Reconnect failed: ${e.message}`);
        }
      }, 5000);
    });
    created.on('error', e => log(`Bot error: ${e.message}`));
  });
}

// === DISCORD SETUP ===
async function startDiscord() {
  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
  });

  client.on('ready', () => log(`Discord ready as ${client.user.tag}`));

  client.on('messageCreate', msg => {
    if (msg.channel.id !== config.discord.channelId || msg.author.bot) return;
    if (!bot) return msg.reply('Bot not connected to Minecraft.');

    // === NEW: combine multi-line messages ===
    const combined = msg.content.replace(/\r?\n/g, ' ').trim();

    const q = bot._chatQueue || (bot._chatQueue = new ChatQueue(bot));
    q.enqueue(`<${msg.author.username}> ${combined}`);
  });

  await client.login(config.discord.token);
}

// === START ===
(async () => {
  try {
    await startDiscord();
    await createBotAndAttach();
    log('Bot fully online.');
  } catch (e) {
    log(`Startup failed: ${e.message}`);
    // === AUTO RETRY STARTUP ===
    setTimeout(() => {
      log('Retrying full startup...');
      (async () => {
        try {
          await startDiscord();
          await createBotAndAttach();
          log('Bot fully online (after retry).');
        } catch (err) {
          log(`Retry failed: ${err.message}`);
        }
      })();
    }, 10000);
  }
})();
