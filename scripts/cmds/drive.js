const axios = require('axios');
const apiUrl = "http://65.109.80.126:20409/aryan/drive";

module.exports = {
  config: {
    name: "drive",
    version: "0.0.2",
    author: "Christus",
    countDown: 5,
    role: 2,
    description: "Uploader facilement des vidéos sur Google Drive !",
    category: "utility",
    guide: "Utilisation : {pn} <lien> pour uploader une vidéo depuis un lien\nOu répondre à un message avec média pour uploader"
  },

  onStart: async function ({ message, event, args }) {
    const mediaUrl = event?.messageReply?.attachments?.[0]?.url || args[0];

    if (!mediaUrl)
      return message.reply("⚠️ Merci de fournir un lien vidéo valide ou de répondre à un message contenant un média.");

    try {
      const response = await axios.get(`${apiUrl}?url=${encodeURIComponent(mediaUrl)}`);
      const data = response.data || {};
      console.log("Réponse API :", data);

      const driveLink = data.driveLink || data.driveLIink;
      if (driveLink) 
        return message.reply(`✅ Fichier uploadé sur Google Drive avec succès !\n\n🔗 Lien : ${driveLink}`);

      const errorMsg = data.error || JSON.stringify(data) || "❌ Échec de l'upload du fichier.";
      return message.reply(`Échec de l'upload : ${errorMsg}`);
    } catch (err) {
      console.error("Erreur d'upload :", err.message || err);
      return message.reply("❌ Une erreur est survenue lors de l'upload. Merci de réessayer plus tard.");
    }
  }
};
