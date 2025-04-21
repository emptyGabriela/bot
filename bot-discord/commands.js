if (commandName === 'agregarrol') {
  const emoji = options.getString('emoji');
  const name = options.getString('nombre');
  const guild = interaction.guild;

  let rol = guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase());

  if (!rol) {
    try {
      rol = await guild.roles.create({
        name: name,
        reason: 'Rol creado automáticamente por el bot',
      });
    } catch (err) {
      console.error('❌ Error al crear rol:', err);
      return interaction.reply('❌ No se pudo crear el rol automáticamente.');
    }
  }

  const roleId = rol.id;

  try {
    await pg.query(
      'INSERT INTO roles (emoji, role_id, name) VALUES ($1, $2, $3) ON CONFLICT (emoji) DO UPDATE SET role_id = $2, name = $3',
      [emoji, roleId, name]
    );

    await interaction.reply(`✅ Rol agregado: ${emoji} ➝ <@&${roleId}>`);
  } catch (err) {
    console.error('❌ Error al guardar en la base de datos:', err);
    await interaction.reply('❌ No se pudo guardar el rol en la base de datos.');
  }
}

if (commandName === 'eliminarrol') {
  const emoji = options.getString('emoji');
  const guild = interaction.guild;

  try {
    const res = await pg.query('SELECT role_id FROM roles WHERE emoji = $1', [emoji]);
    if (res.rowCount === 0) {
      return await interaction.reply(`⚠️ No se encontró un rol asociado al emoji ${emoji}.`);
    }

    const roleId = res.rows[0].role_id;
    await pg.query('DELETE FROM roles WHERE emoji = $1', [emoji]);

    const rol = guild.roles.cache.get(roleId);
    if (rol) await rol.delete('Eliminado desde el bot');

    await interaction.reply(`🗑️ Rol eliminado: ${emoji}`);
  } catch (err) {
    console.error('❌ Error al eliminar rol:', err);
    await interaction.reply('❌ Hubo un error al intentar eliminar el rol.');
  }
}

if (commandName === 'editarrol') {
  const emoji = options.getString('emoji');
  const nuevoNombre = options.getString('nuevo_nombre');
  const guild = interaction.guild;

  try {
    const res = await pg.query('SELECT role_id FROM roles WHERE emoji = $1', [emoji]);
    if (res.rowCount === 0) {
      return await interaction.reply(`⚠️ No se encontró ningún rol asociado al emoji ${emoji}.`);
    }

    const roleId = res.rows[0].role_id;
    const rol = guild.roles.cache.get(roleId);
    if (!rol) return await interaction.reply(`⚠️ El rol con ID ${roleId} no existe en el servidor.`);

    await rol.setName(nuevoNombre);
    await pg.query('UPDATE roles SET name = $1 WHERE emoji = $2', [nuevoNombre, emoji]);

    await interaction.reply(`📝 Rol actualizado: ${emoji} ➝ <@&${roleId}> con nuevo nombre "${nuevoNombre}"`);
  } catch (err) {
    console.error('❌ Error al editar rol:', err);
    await interaction.reply('❌ No se pudo editar el rol.');
  }
}