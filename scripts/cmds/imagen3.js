const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "imagen3",
    aliases: [],
    version: "1.0",
    author: "Christus",
    countDown: 5,
    role: 0,
    description: {
      fr: "Génère une image IA en utilisant l'API Oculux Imagen3",
    },
    category: "générateur d'images",
    guide: {
      fr: "{pn} <prompt>\nExemple : ${prefix}imagen3 dragon futuriste volant dans l'espace",
    },
  },

  onStart: async function ({ message, event, args, api, commandName }) {
    const prefix = global.utils?.getPrefix
      ? global.utils.getPrefix(event.threadID)
      : global.GoatBot?.config?.prefix || "/";

    const prompt = args.join(" ");

    if (!prompt) {
      return message.reply(
        `⚠️ Veuillez fournir un prompt.\nExemple : ${prefix}${commandName} dragon futuriste volant dans l'espace`
      );
    }

    api.setMessageReaction("🎨", event.messageID, () => {}, true);
    const waitingMsg = await message.reply("🎨 Génération de votre image Imagen3... Veuillez patienter...");

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://dev.oculux.xyz/api/imagen3?prompt=${encodedPrompt}`;
    const imgPath = path.join(__dirname, "cache", `imagen3_${event.senderID}.png`);

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, response.data);

      await message.reply(
        {
          body: `✅ Voici votre image générée ${commandName}.`,
          attachment: fs.createReadStream(imgPath),
        },
        () => {
          fs.unlinkSync(imgPath);
          if (waitingMsg?.messageID) api.unsendMessage(waitingMsg.messageID);
        }
      );
    } catch (error) {
      console.error("Erreur de génération Imagen3 :", error);
      message.reply("⚠️ Échec de la génération de l'image. Veuillez réessayer plus tard.");
      if (waitingMsg?.messageID) api.unsendMessage(waitingMsg.messageID);
    }
  },
};
