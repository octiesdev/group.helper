const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// 🔑 Токен бота
const token = '8067441528:AAGBtpPLQBoNGuPLmCRV5VEeecmvEVjxFd4';
const bot = new TelegramBot(token, { polling: true });

// 📥 Загружаем команды
const commands = JSON.parse(fs.readFileSync('./commands.json', 'utf8'));

const adminId = 7236554978; // <-- замени на свой Telegram user ID

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

// 🔧 Изменить описание
bot.onText(/^\/editcaption (.+)/, (msg, match) => {
    if (msg.from.id !== adminId) return;
    const [cmd, newCaption] = match[1].split('|').map(x => x.trim());
    if (!commands[cmd]) return bot.sendMessage(msg.chat.id, '⚠️ Команда не найдена.');
    if (!newCaption) return bot.sendMessage(msg.chat.id, '❗ Укажите описание.');
  
    commands[cmd].caption = newCaption;
    fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
    bot.sendMessage(msg.chat.id, `✏️ Описание команды ${cmd} обновлено.`);
  });
  
  // 🔧 Изменить картинку
  bot.onText(/^\/editimage (.+)/, (msg, match) => {
    if (msg.from.id !== adminId) return;
    const [cmd, newImage] = match[1].split('|').map(x => x.trim());
    if (!commands[cmd]) return bot.sendMessage(msg.chat.id, '⚠️ Команда не найдена.');
    if (!newImage) return bot.sendMessage(msg.chat.id, '❗ Укажите имя файла изображения.');
  
    commands[cmd].image = newImage;
    fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
    bot.sendMessage(msg.chat.id, `🖼️ Изображение команды ${cmd} обновлено.`);
  });
  
  // 🔧 Изменить кнопку
  bot.onText(/^\/editbutton (.+)/, (msg, match) => {
    if (msg.from.id !== adminId) return;
    const [cmd, buttonText, buttonUrl] = match[1].split('|').map(x => x.trim());
    if (!commands[cmd]) return bot.sendMessage(msg.chat.id, '⚠️ Команда не найдена.');
    if (!buttonText || !buttonUrl) return bot.sendMessage(msg.chat.id, '❗ Укажите текст и ссылку для кнопки.');
  
    commands[cmd].buttonText = buttonText;
    commands[cmd].buttonUrl = buttonUrl;
    fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
    bot.sendMessage(msg.chat.id, `🔘 Кнопка команды ${cmd} обновлена.`);
  });
  
  // 🗑️ Удалить кнопку
  bot.onText(/^\/removebutton (.+)/, (msg, match) => {
    if (msg.from.id !== adminId) return;
    const cmd = match[1].trim();
    if (!commands[cmd]) return bot.sendMessage(msg.chat.id, '⚠️ Команда не найдена.');
  
    delete commands[cmd].buttonText;
    delete commands[cmd].buttonUrl;
    fs.writeFileSync('./commands.json', JSON.stringify(commands, null, 2));
    bot.sendMessage(msg.chat.id, `❌ Кнопка у команды ${cmd} удалена.`);
  });

bot.onText(/^\/help$/, (msg) => {
  const helpText = `
📌 <b>Команды администратора:</b>
/addcommand !cmd | caption | image.png | [buttonText] | [buttonUrl] — добавить новую команду
/editcommand !cmd | caption | image.png | [buttonText] | [buttonUrl] — изменить команду полностью
/deletecommand !cmd — удалить команду

✏️ <b>Изменение отдельных частей:</b>
/editcaption !cmd | новый текст — изменить только описание
/editimage !cmd | image.png — изменить только картинку
/editbutton !cmd | текст кнопки | ссылка — изменить только кнопку
/removebutton !cmd — удалить кнопку

ℹ️ Команды должны начинаться с <code>!</code>. Например: <code>!limitnode15</code>

💡 Все команды работают только для администратора (по Telegram ID)
  `;
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'HTML' });
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