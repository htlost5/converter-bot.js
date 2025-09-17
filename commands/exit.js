const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, PresenceUpdateStatus, ActivityType } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('exit')
        .setDescription('Exit Process'),
    async execute(interaction) {
        const client = interaction.client;
        await interaction.reply(`Stopped the script!`);

        await client.user.setStatus(PresenceUpdateStatus.Offline);
        await client.user.setActivity(null);

        config.status = false;
        config.n = null;

        const configPath = path.join(__dirname, '../config.json');

        await fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 4),
            'utf8'
        );

        process.exit(0);
    }
};