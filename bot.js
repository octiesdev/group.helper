const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// 🔑 Токен бота
const token = '8067441528:AAGBtpPLQBoNGuPLmCRV5VEeecmvEVjxFd4';
const bot = new TelegramBot(token, { polling: true });

// 📥 Загружаем команды
const commands = JSON.parse(fs.readFileSync('./commands.json', 'utf8'));

// 📩 Обработка сообщений
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