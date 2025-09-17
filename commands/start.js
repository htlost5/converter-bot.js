const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder, PresenceUpdateStatus, ActivityType } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('start the converter')
        .addNumberOption(option => 
            option
                .setName('num')
                .setDescription('2~36の数値を入力')
                .setRequired(true)
                .setMinValue(2)
                .setMaxValue(36)
        ),
    async execute(interaction) {
        const n = interaction.options.getNumber('num');
        const client = interaction.client

        await client.user.setStatus(PresenceUpdateStatus.Online);
        await client.user.setActivity({
            name: `${n}進数変換`,
            type: ActivityType.Playing
        });

        if (config.status === true) {
            await interaction.reply(`Change Converter to: ${n}`);
        } else {
            await interaction.reply(`Started Converter: ${n}`);
        }

        config.status = true;
        config.n = n;

        const configPath = path.join(__dirname, '../config.json');

        console.log(configPath);

        fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 4),
            'utf8'
        );
    }
};