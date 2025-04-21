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

const canalId = '1363690163863294046';

// Obtiene los emojis y roles de la BD
async function obtenerRolesDesdeBD() {
  const res = await pg.query('SELECT * FROM roles');
  const mapa = {};
  for (const fila of res.rows) {
    mapa[fila.emoji] = fila.role_id;
  }
  return mapa;
}

// Envía el mensaje de roles
async function enviarMensajeRoles(roleMappings) {
  const canal = await client.channels.fetch(canalId);
  const mensaje = await canal.send('📋 Reacciona para obtener un rol:');

  for (const emoji of Object.keys(roleMappings)) {
    await mensaje.react(emoji);
  }

  // Guarda el ID del mensaje en BD 
}

// Asigna el rol al reaccionar
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const emoji = reaction.emoji.name;
  try {
    const res = await pg.query('SELECT role_id FROM roles WHERE emoji = $1', [emoji]);
    if (res.rowCount === 0) return;

    const roleId = res.rows[0].role_id;
    const member = await reaction.message.guild.members.fetch(user.id);
    await member.roles.add(roleId);
    console.log(`✅ Rol asignado: ${emoji} ➝ ${user.username}`);
  } catch (err) {
    console.error('❌ Error al asignar rol:', err);
  }
});

// Quita el rol al quitar la reacción
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const emoji = reaction.emoji.name;
  try {
    const res = await pg.query('SELECT role_id FROM roles WHERE emoji = $1', [emoji]);
    if (res.rowCount === 0) return;

    const roleId = res.rows[0].role_id;
    const member = await reaction.message.guild.members.fetch(user.id);
    await member.roles.remove(roleId);
    console.log(`❎ Rol removido: ${emoji} ➝ ${user.username}`);
  } catch (err) {
    console.error('❌ Error al remover rol:', err);
  }
});

// Al iniciar
client.once('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  await pg.connect();

  const roleMappings = await obtenerRolesDesdeBD();
  await enviarMensajeRoles(roleMappings); 

  
});

// Slash commands
client.on('interactionCreate', async (interaction) => {
  try {
    await handleCommands(interaction);
  } catch (err) {
    console.error('❌ Error al manejar comando:', err);
  }
});

client.login(process.env.TOKEN);
