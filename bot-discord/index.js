require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Client: PgClient } = require('pg');
const handleCommands = require('./commands');

const pg = new PgClient({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const canalId = 'ID_DEL_CANAL';

async function obtenerRolesDesdeBD() {
  const res = await pg.query('SELECT * FROM roles');
  const mapa = {};
  for (const fila of res.rows) {
    mapa[fila.emoji] = fila.role_id;
  }
  return mapa;
}

async function enviarMensajeRoles(roleMappings) {
  const canal = await client.channels.fetch(canalId);
  const mensaje = await canal.send('📋 Reacciona para obtener un rol:');

  for (const emoji of Object.keys(roleMappings)) {
    await mensaje.react(emoji);
  }

  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    const emoji = reaction.emoji.name;
    if (!roleMappings[emoji]) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    await member.roles.add(roleMappings[emoji]);
  });

  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    const emoji = reaction.emoji.name;
    if (!roleMappings[emoji]) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    await member.roles.remove(roleMappings[emoji]);
  });
}

client.once('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  await pg.connect();
  const roleMappings = await obtenerRolesDesdeBD();
  await enviarMensajeRoles(roleMappings);
});

client.on('interactionCreate', async (interaction) => {
  try {
    await handleCommands(interaction);
  } catch (err) {
    console.error('❌ Error al manejar comando:', err);
  }
});

client.login(process.env.TOKEN);
