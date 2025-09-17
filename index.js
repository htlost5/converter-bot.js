const http = require('http');
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, {'content-type':'text/plain'});
    res.end('ok');
}).listen(PORT, () => {
    console.log(`Health server listening on ${PORT}`);
});

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, PresenceUpdateStatus, ActivityType, WebhookClient } = require('discord.js');
const config = require('./config.json');

const dotenv = require('dotenv');
dotenv.config();

const TOKEN = process.env.TOKEN;

const channelWebhooks = {
    general: "https://discord.com/api/webhooks/1417571745921237133/1JgD750mXRnI1hTC5Dz1LJNPEVrOXU3tQxW-oV5CmlOzfa8L2zqTvW_vizvxRC91nCkE",
    save: "https://discord.com/api/webhooks/1417571759590346844/eUWie437hjQoR5G78859mXkgy7tx70y6QvTSaflvgJ1o-vvDVd7YsJxnoMzZ5Gibf9Uy",
    log: "https://discord.com/api/webhooks/1417571754733207643/T9QCj3F3C2A6EYIaFlcO7Aa2q42W4VXkFAZ3xy8B0fBdXHAhpA9OqvkIOL0M--QY63gh"
}

const generalWebhook = new WebhookClient({ url: channelWebhooks.general });
const saveWebhook = new WebhookClient({ url: channelWebhooks.save });
const logWebhook = new WebhookClient({ url: channelWebhooks.log });

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

client.on(Events.MessageCreate, sourceMessage => {
    const message = sourceMessage;

    // 二重検出の防止
    if (message.author.id === client.user.id || message.webhookId) return;

    // 空白メッセージ排除
    if (message.content.trim() === '') return;

    const status = config.status;
    const num = config.n;

    if (status === true && (num >= 2 || num <= 36)) {
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

        // メッセージ変換
        codes = Array.from(message.content).map(ch => ch.codePointAt(0).toString(num));
        lengths = codes.map(c => c.length);
        convertedMessage = codes.join("");

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