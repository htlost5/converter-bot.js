const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('discord.js');
// const dotenv = require('dotenv');
// dotenv.config();

const token = process.env.TOKEN;
const channelId = process.env.RUN_GENERAL_CHANNEL_ID;

const translater = (txt) => {
    const element = txt.split(' ');
    const base = parseInt(element.pop(), 10);
    console.log(base);

    const bytes = Uint8Array.from(element.map(code => parseInt(code, base)));
    
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('to translate meesage, if you input the message_ID you can translate that.')
        .addStringOption(option => 
            option
                .setName('id_text_url')
                .setDescription('メッセージID、テキスト、URLのいずれかを入力')
                .setRequired(true)
        ),
    async execute(interaction) {
        const txt = interaction.options.getString('id_text_url');

        if (Number.isInteger(Number(txt))) {
            const url = `https://discord.com/api/v10/channels/${channelId}/messages/${txt}`;
            try {
                const res = await fetch(url, {
                    headers: { Authorization: `Bot ${token}`}
                });
                const msg = await res.json();
                const original = translater(msg.content);
                console
                return interaction.reply(original);

            } catch (error) {
                interaction.reply("error: メッセージが削除された可能性あり");
                console.log(error);
                return;
            }
        } else {
            const url_match = /https?:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/g;
            const matches = url_match.exec(txt);
            if (matches) {
                const [_, guildId, channelId, messageId] = matches;
                const channel = await interaction.client.channels.fetch(channelId);
                const msg = await channel.messages.fetch(messageId);
                const original = translater(msg.content);
                return interaction.reply(original);
            } else {
                const msg = txt;
                const original = translater(msg);
                return interaction.reply(original);
            }
        }
    }
}