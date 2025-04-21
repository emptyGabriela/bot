require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'agregarrol',
    description: 'Agrega un nuevo rol con un emoji',
    options: [
      {
        name: 'emoji',
        description: 'Emoji para asociar al rol',
        type: 3,
        required: true
      },
      {
        name: 'rol',
        description: 'ID del rol en Discord',
        type: 3,
        required: true
      },
      {
        name: 'nombre',
        description: 'Nombre descriptivo del rol (opcional)',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'eliminarrol',
    description: 'Elimina un rol por emoji',
    options: [
      {
        name: 'emoji',
        description: 'Emoji a eliminar',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'editarrol',
    description: 'Edita un rol existente',
    options: [
      {
        name: 'emoji',
        description: 'Emoji registrado',
        type: 3,
        required: true
      },
      {
        name: 'nuevo_rol',
        description: 'Nuevo ID del rol',
        type: 3,
        required: true
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const clientId = 'TU_CLIENT_ID';   // 👈 Reemplaza
const guildId = 'TU_GUILD_ID';     // 👈 Reemplaza

(async () => {
  try {
    console.log('📡 Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
