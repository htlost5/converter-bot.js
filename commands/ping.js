const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('respond pong!')
        .addNumberOption(option => 
            option
                .setName('value')
                .setDescription('2~36の数値を入力')
                .setRequired(true)
                .setMinValue(2)
                .setMaxValue(36)
        ),
    async execute(interaction) {
        const numberValue = interaction.options.getNumber('value');
        if (numberValue === null) {
            await interaction.reply('数値が指定されませんでした。')
        } else {
            await interaction.reply(`${numberValue} Pong! です。`)
        }
    },
};