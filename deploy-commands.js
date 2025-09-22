const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

// const dotenv = require('dotenv');
// dotenv.config();

const TOKEN = process.env.TOKEN;
const client_id = process.env.CLIENT_ID;

const channelIds = {
    general: process.env.RUN_GENERAL_CHANNEL_ID,
    save: process.env.RUN_SAVE_CHANNEL_ID,
    log: process.env.RUN_LOG_CHANNEL_ID
}

const guildIds = {
    server1: process.env.RUN_GUILD_ID
}

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(client_id, guildIds.server1),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();