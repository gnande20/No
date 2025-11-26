const axios = require('axios');
const validUrl = require('valid-url');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GEMINI_API = "https://api.nekolabs.web.id/ai/gemini/2.0-flash/v2";

const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// 📥 Téléchargement fichiers (si un jour Gemini renvoie img)
const downloadFile = async (url, ext) => {
  const filePath = path.join(TMP_DIR, `${uuidv4()}.${ext}`);
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(filePath, Buffer.from(response.data));
  return filePath;
};

// 🧠 Fonction principale de requête Gemini
const handleGeminiRequest = async (api, event, userInput, message) => {
  const userId = event.senderID;
  let text = userInput.trim();
  let imageUrl = null;

  api.setMessageReaction("⏳", event.messageID, () => {}, true);

  // Détecter URL dans un prompt
  const urlMatch = text.match(/(https?:\/\/\S+)/)?.[0];
  if (urlMatch && validUrl.isWebUri(urlMatch)) {
    imageUrl = urlMatch;
    text = text.replace(urlMatch, "").trim();
  }

  if (!text && !imageUrl) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return message.reply("💬 Please provide a prompt or an image.");
  }

  try {
    const url =
      GEMINI_API +
      `?text=${encodeURIComponent(text)}` +
      `&systemPrompt=${encodeURIComponent("You are a helpful assistant")}`;

    const res = await axios.get(url);

    if (!res.data?.success) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("⚠️ Gemini API Error.");
    }

    const replyText = res.data.result || "No response.";

    const sent = await message.reply({ body: replyText });

    global.GoatBot.onReply.set(sent.messageID, {
      commandName: "gemini",
      author: userId
    });

    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    message.reply("⚠️ Gemini Error:\n" + err.message);
  }
};

module.exports = {
  config: {
    name: "gemini2",
    version: "1.0.0",
    author: "Christus",
    role: 0,
    category: "ai",
    longDescription: {
      en: "Gemini 2.0 Flash: chat intelligent et rapide."
    },
    guide: {
      en: ".gemini [message] → discuter avec Gemini"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const userInput = args.join(" ").trim();
    if (!userInput) return message.reply("❗ Please enter a message.");
    return await handleGeminiRequest(api, event, userInput, message);
  },

  onReply: async function ({ api, event, Reply, message }) {
    if (event.senderID !== Reply.author) return;
    const userInput = event.body?.trim();
    if (!userInput) return;
    return await handleGeminiRequest(api, event, userInput, message);
  },

  onChat: async function ({ api, event, message }) {
    const body = event.body?.trim();
    if (!body?.toLowerCase().startsWith("gemini ")) return;
    const userInput = body.slice(7).trim();
    if (!userInput) return;
    return await handleGeminiRequest(api, event, userInput, message);
  }
};
