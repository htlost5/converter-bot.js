const { Client, Events, GatewayIntentBits, PresenceUpdateStatus, ActivityType, WebhookClient } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.TOKEN;

const channelIds = {
    general: process.env.GENERAL_CHANNEL_ID,
    save: process.env.SAVE_CHANNEL_ID,
    log: process.env.LOG_CHANNEL_ID
}

const channelURLs = {
    save: 'https://discord.com/channels/1414560938765455392/1417491501675708456'
}

const channelWebhooks = {
    general: "https://discord.com/api/webhooks/1417528291883225129/QCYna0Gd14iYh1JBP7s3xgtnoZKcmxxKpC_d__xcKK7jl96G26GsS1oedg_Epr6AObco",
    save: "https://discord.com/api/webhooks/1417528335969423552/yyFN5eXR3krDbgT0ohi8LgkgLXVoc0pSDVaHGPc6VDlouHvaMD1Yo7y5P1N9BusoVsiS",
    log: "https://discord.com/api/webhooks/1417528344194580582/jSP6Bnn8ubLwbe3DeeetZRPh3i4UbySWTUYLNUrLp_UI79I3qPiGrEqOg2OJ4IG3tAf6"
}

const avatarURLs = {
    vscode: "https://www.imagazine.co.jp/wp-content/uploads/2022/05/opengraph-blog.png"
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const generalWebhook = new WebhookClient({ url: channelWebhooks.general });
const saveWebhook = new WebhookClient({ url: channelWebhooks.save });
const logWebhook = new WebhookClient({ url: channelWebhooks.log });

let status = Boolean(false);
let n = Number(0);

let message;

let codes = String("");
let lengths = [];
let convertedMessage = String("");

let history = String("");


client.once(Events.ClientReady, readyClient => {
    console.log(`logged as ${readyClient.user.tag}`);
    client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
    client.user.setActivity({
        name: '待機中',
        type: ActivityType.Custom
    });
});


client.on(Events.MessageCreate, sourceMessage => {
    message = sourceMessage;

    // 二重検出の防止
    if (message.author.id === client.user.id || message.webhookId) return;

    if (message.content.trim() === '') return;

    // コマンドを認識
    if (typeof message.content === 'string' && message.content.startsWith("!")) {
        console.log("recognized!")
        
        if (n >= 2 && convertedMessage !== "" && message.content.match(/translate/)) {
            try {
                let start = 0;
                let restored = lengths.map(len => {
                    let chunk = convertedMessage.substr(start, len);
                    start += len;
                    return String.fromCodePoint(parseInt(chunk, n));
                }).join("");

                generalWebhook.send({
                    content: `${restored}`,
                    username: 'vscode',
                    avatarURL: avatarURLs.vscode
                });
                return;

            } catch(e) {
                console.log(e);
                logWebhook.send({
                    content: 'error: TranslateError' + '\n' + e,
                    username: 'vscode',
                    avatarURL: avatarURLs.vscode
                });
            }
        }

        // startコマンド
        if (message.content.match(/start/) && status === false) {
            const match = message.content.match(/!start:\s*(\d+)/);
            if(!match) {
                generalWebhook.send({
                    content: "error: startCmd is uncollect." + '\n' + "!start: n(2~36)",
                    username: 'vscode',
                    avatarURL: avatarURLs.vscode
                });
                return;
            }

            n = parseInt(match[1], 10);
            
            if (n < 2 || n > 36) {
                generalWebhook.send({
                    content: 'useable number is 2~36',
                    username: 'vscode',
                    avatarURL: avatarURLs.vscode
                });
                return;
            }

            client.user.setStatus(PresenceUpdateStatus.Online);
            client.user.setActivity({
                name: `${n}進数変換`,
                type: ActivityType.Playing
            });

            status = true;
            return
            
        // stopコマンド
        } else if (message.content.match(/stop/) && status === true) {
            status = false;
            n = null;

            convertedMessage = String("");
            lengths = [];

            client.user.setStatus(PresenceUpdateStatus.DoNotDisturb);
            client.user.setActivity({
                name: '待機中',
                type: ActivityType.Custom
            });

            generalWebhook.send({
                content: 'Finished',
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL({ format: 'png', size: 128 })
            });
            return

        // エラーハンドリング（ステータスとコマンドの矛盾）
        } else {
            generalWebhook.send({
                content: 'Command Error',
                username: 'vscode',
                avatarURL: avatarURLs.vscode
            });
            return;
        }

    } else {

        if (status === true) {

            // メッセージ削除
            if (typeof message.content === 'string' && message.content.trim() !== '') {
                message.delete();
            }
    
            // メッセージの転送
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
            codes = Array.from(message.content).map(ch => ch.codePointAt(0).toString(n));
            lengths = codes.map(c => c.length);
            convertedMessage = codes.join("");

            // 変換後送信
            generalWebhook.send({
                content: convertedMessage,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL({ format: 'png', size: 128 })
            });
        }
    }
});

client.login(token);