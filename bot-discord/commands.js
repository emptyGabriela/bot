require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
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

  // 🔽 Aquí pega el bloque que te pasé antes 👇
  if (commandName === 'agregarrol') {
    const emoji = options.getString('emoji');
    const name = options.getString('nombre') || 'Rol generado';

    const guild = interaction.guild;

    // Verifica si ya existe un rol con ese nombre
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

  // Aquí puedes seguir con eliminarrol, editarrol, etc.
});

client.once('ready', () => {
  console.log(`🤖 Bot listo como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
