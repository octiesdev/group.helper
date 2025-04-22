const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// 🔑 Токен бота
const token = '8067441528:AAGBtpPLQBoNGuPLmCRV5VEeecmvEVjxFd4';
const bot = new TelegramBot(token, { polling: true });

// 📥 Загружаем команды
const commands = JSON.parse(fs.readFileSync('./commands.json', 'utf8'));

const adminId = 123456789; // <-- замени на свой Telegram user ID

bot.onText(/^\/addcommand (.+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const parts = match[1].split('|').map(s => s.trim());
  const [cmd, caption, image, buttonText, buttonUrl] = parts;

  if (!cmd || !caption || !image) return bot.sendMessage(msg.chat.id, '❗ Формат: /addcommand !cmd | caption | image.png | [buttonText] | [buttonUrl]');

  commands[cmd] = {
    image,
    caption,
    ...(buttonText && buttonUrl ? { buttonText, buttonUrl } : {})
  };

  fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
  bot.sendMessage(msg.chat.id, `✅ Команда ${cmd} добавлена.`);
});

bot.onText(/^\/editcommand (.+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const parts = match[1].split('|').map(s => s.trim());
  const [cmd, caption, image, buttonText, buttonUrl] = parts;

  if (!commands[cmd]) return bot.sendMessage(msg.chat.id, '⚠️ Команда не найдена.');
  if (!caption || !image) return bot.sendMessage(msg.chat.id, '❗ Формат: /editcommand !cmd | caption | image.png | [buttonText] | [buttonUrl]');

  commands[cmd] = {
    image,
    caption,
    ...(buttonText && buttonUrl ? { buttonText, buttonUrl } : {})
  };

  fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
  bot.sendMessage(msg.chat.id, `✏️ Команда ${cmd} обновлена.`);
});

bot.onText(/^\/deletecommand (.+)/, (msg, match) => {
  if (msg.from.id !== adminId) return;
  const cmd = match[1].trim();
  if (!commands[cmd]) return bot.sendMessage(msg.chat.id, '⚠️ Команда не найдена.');

  delete commands[cmd];
  fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
  bot.sendMessage(msg.chat.id, `🗑️ Команда ${cmd} удалена.`);
});

bot.on('message', (msg) => {
  const chatType = msg.chat.type;
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!['group', 'supergroup'].includes(chatType)) return;
  if (!text || !text.startsWith('!')) return;

  const commandKey = text.split(' ')[0];
  const command = commands[commandKey];

  if (command) {
    const { image, caption, buttonText, buttonUrl } = command;
    const imagePath = path.join(__dirname, 'images', image);

    // Проверка: существует ли файл
    if (!fs.existsSync(imagePath)) {
      return bot.sendMessage(chatId, '⚠️ Ошибка: изображение не найдено.');
    }

    const options = {
      caption: caption,
      parse_mode: 'HTML'
    };

    if (
      typeof buttonText === 'string' &&
      typeof buttonUrl === 'string' &&
      buttonText.trim() !== '' &&
      buttonUrl.trim() !== ''
    ) {
      options.reply_markup = {
        inline_keyboard: [[{ text: buttonText.trim(), url: buttonUrl.trim() }]]
      };
    }

    bot.sendPhoto(chatId, fs.createReadStream(imagePath), options);
  }
});