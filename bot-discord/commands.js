require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Pool } = require('pg');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const pg = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'agregarrol') {
    const emoji = options.getString('emoji');
    const roleId = options.getString('rol');
    const name = options.getString('nombre') || 'Rol generado';
    const grupo = options.getString('grupo');

    try {
      await pg.query(
        'INSERT INTO roles (emoji, role_id, name, grupo) VALUES ($1, $2, $3, $4) ON CONFLICT (emoji) DO UPDATE SET role_id = $2, name = $3, grupo = $4',
        [emoji, roleId, name, grupo]
      );
      await interaction.reply(`✅ Rol agregado: ${emoji} ➝ <@&${roleId}> (${grupo})`);
    } catch (err) {
      console.error('❌ Error al guardar en la base de datos:', err);
      await interaction.reply('❌ No se pudo guardar el rol en la base de datos.');
    }
  }

  if (commandName === 'eliminarrol') {
    const emoji = options.getString('emoji');

    try {
      const res = await pg.query('SELECT role_id FROM roles WHERE emoji = $1', [emoji]);

      if (res.rowCount === 0) {
        return interaction.reply('⚠️ No se encontró ningún rol con ese emoji.');
      }

      const roleId = res.rows[0].role_id;
      const rol = interaction.guild.roles.cache.get(roleId);

      if (rol) {
        await rol.delete('Eliminado por comando /eliminarrol');
      }

      await interaction.reply(`🗑️ Rol de Discord eliminado: ${emoji}`);
    } catch (err) {
      console.error('❌ Error al eliminar rol:', err);
      await interaction.reply('❌ No se pudo eliminar el rol de Discord.');
    }
  }

  if (commandName === 'editarrol') {
    const emoji = options.getString('emoji');
    const nuevoRol = options.getString('nuevo_rol');

    try {
      const res = await pg.query(
        'UPDATE roles SET role_id = $1 WHERE emoji = $2 RETURNING *',
        [nuevoRol, emoji]
      );

      if (res.rowCount === 0) {
        return interaction.reply('⚠️ No se encontró un rol con ese emoji para editar.');
      }

      await interaction.reply(`✏️ Rol editado: ${emoji} ahora tiene ID ${nuevoRol}`);
    } catch (err) {
      console.error('❌ Error al editar rol:', err);
      await interaction.reply('❌ No se pudo editar el rol en la base de datos.');
    }
  }
});

client.once('ready', () => {
  console.log(`🤖 Bot listo como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
