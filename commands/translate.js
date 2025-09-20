const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('to translate meesage, if you input the message_ID you can translate that.')
        .addStringOption(option => 
            option
                .setName('ID/text')
                .setDescription('メッセージIDまたはテキストを入力')
                .setRequired(false)
        ),
    async execute(interaction) {
        const txt = interaction.options.getString('ID/text');
        if(Number.isInteger(Number(txt)) && txt.length) {
            if()
        }
    }
}