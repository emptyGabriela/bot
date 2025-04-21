const { Client: PgClient } = require('pg');

const pg = new PgClient({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, options } = interaction;

  if (!pg._connected) {
    await pg.connect();
    pg._connected = true;
  }

  if (commandName === 'agregarrol') {
    const emoji = options.getString('emoji');
    const roleId = options.getString('rol');
    const name = options.getString('nombre') || '';

    try {
      await pg.query(
        'INSERT INTO roles (emoji, role_id, name) VALUES ($1, $2, $3) ON CONFLICT (emoji) DO UPDATE SET role_id = $2, name = $3',
        [emoji, roleId, name]
      );
      await interaction.reply(`✅ Rol agregado: ${emoji} ➝ <@&${roleId}>`);
    } catch (err) {
      console.error(err);
      await interaction.reply('❌ Error al agregar el rol.');
    }
  }

  if (commandName === 'eliminarrol') {
    const emoji = options.getString('emoji');

    try {
      await pg.query('DELETE FROM roles WHERE emoji = $1', [emoji]);
      await interaction.reply(`🗑️ Emoji eliminado: ${emoji}`);
    } catch (err) {
      console.error(err);
      await interaction.reply('❌ Error al eliminar el rol.');
    }
  }

  if (commandName === 'editarrol') {
    const emoji = options.getString('emoji');
    const nuevoRol = options.getString('nuevo_rol');

    try {
      await pg.query('UPDATE roles SET role_id = $1 WHERE emoji = $2', [nuevoRol, emoji]);
      await interaction.reply(`✏️ Emoji ${emoji} ahora apunta a <@&${nuevoRol}>`);
    } catch (err) {
      console.error(err);
      await interaction.reply('❌ Error al editar el rol.');
    }
  }
};
