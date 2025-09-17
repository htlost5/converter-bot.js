const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, PresenceUpdateStatus, ActivityType } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('stop the converter'),
    async execute(interaction) {
        const client = interaction.client;

        if (config.status === false) {
            interaction.reply("No script is runnig!");
            return;
        }

        await client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
        await client.user.setActivity({
            name: `待機中`,
            type: ActivityType.Watching
        });

        config.status = false;
        config.n = null;

        const configPath = path.join(__dirname, '../config.json');

        fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 4),
            'utf8'
        );

        await interaction.reply(`Stop Converter!`);
    }
}