const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, PresenceUpdateStatus, ActivityType, WebhookClient } = require('discord.js');
const config = require('./config.json');

// const dotenv = require('dotenv');
// dotenv.config();

// HTTPサーバ
const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => res.send('ok')); // ヘルス用
app.get('/health', (req, res) => res.status(200).send('healthy'));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP server listening on ${PORT}`);
});



const TOKEN = process.env.TOKEN;

const channelIds = {
    general: process.env.RUN_GENERAL_CHANNEL_ID,
    save: process.env.RUN_SAVE_CHANNEL_ID,
    log: process.env.RUN_LOG_CHANNEL_ID
}

const channelWebhooks = {
    general: process.env.RUN_GENERAL_WEBHOOK_URL,
    save: process.env.RUN_SAVE_WEBHOOK_URL,
    log: process.env.RUN_LOG_WEBHOOK_URL
}

const generalWebhook = new WebhookClient({ url: channelWebhooks.general });
const saveWebhook = new WebhookClient({ url: channelWebhooks.save });
const logWebhook = new WebhookClient({ url: channelWebhooks.log });

const avatarURLs = {
    vscode: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTz7k7a9qelbBTHXSKbKwRi_JdjfL3BJuH-xQ&s"
}

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[warning] ${filePath} のコマンドには、必要な "data" または "execute" プロパティが有りません。`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(` ${interaction.commandName} というコマンドは存在しません。`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'コマンドを実行中にエラーが発生しました。', ephemeral: true });
    }
});

// メッセージ変換および転送
client.on(Events.MessageCreate, sourceMessage => {
    // メッセージ検出のチャンネルを特定
    if (sourceMessage.channel.id !== channelIds.general) return;

    // 二重検出の防止
    if (sourceMessage.author.id === client.user.id || sourceMessage.webhookId) return;

    // 空白メッセージ排除
    if (sourceMessage.content.trim() === '') return;

    const message = sourceMessage;
    const status = config.status;
    const num = config.n;

    if (status === true && (num >= 2 && num <= 36)) {
        // メッセージ削除
        if (typeof message.content === 'string' && message.content.trim() !== '') {
            message.delete();
        }

        // メッセージ転送
        try {
            saveWebhook.send({
                content: `${message.content}`,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL({ format: 'png', size: 128 })
            });
        } catch(e) {
            console.log(e);
            logWebhook.send({
                content: "error: TransferError" + '\n' + e,
                username: 'vscode',
                avatarURL: avatarURLs.vscode
            });
            return
        }

        // メッセージ変
        const utf8Encoder = new TextEncoder();
        const utf8Bytes = utf8Encoder.encode(message.content);

        const maxCodePoint = 0x10FFFF;
        const max_encode = utf8Encoder.encode(String.fromCodePoint(maxCodePoint));
        const maxLength = Math.max(...Array.from(max_encode).map(b => b.toString(num).length));
        console.log(maxLength);

        const convertedMessage_array = Array.from(utf8Bytes).map(bin => bin.toString(num).padStart(maxLength, '0'));
        convertedMessage_array.push(num);
        const convertedMessage = convertedMessage_array.join(' ');

        // 変換後送信
        generalWebhook.send({
            content: convertedMessage,
            username: message.author.username,
            avatarURL: message.author.displayAvatarURL({ format: 'png', size: 128 })
        });
    }
});

client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    await client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
    await client.user.setActivity({
        name: '待機中',
        type: ActivityType.Watching
    });

    config.status = false;
    config.n = null;

    await fs.writeFileSync(
        './config.json',
        JSON.stringify(config, null, 4),
        'utf8'
    );
});

client.login(TOKEN);