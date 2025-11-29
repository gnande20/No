const axios = require("axios");

async function toFont(text, id = 3) {
  try {
    const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/font?id=${id}&text=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);
    return data.output || text;
  } catch (e) {
    console.error("Erreur API Font :", e.message);
    return text;
  }
}

module.exports = {
  config: {
    name: "quizdrapeau",
    aliases: ["flag", "fqz", "devineflag"],
    version: "1.0",
    author: "Christus",
    countDown: 10,
    role: 0,
    category: "jeu",
    guide: {
      fr: "{pn} — Quiz de devinette de drapeaux"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const apiUrl = "https://xsaim8x-xxx-api.onrender.com/api/flag";
      const { data } = await axios.get(apiUrl);

      const { image, options, answer } = data;

      const imageStream = await axios({
        method: "GET",
        url: image,
        responseType: "stream"
      });

      const body = await toFont(`》 Quiz de Drapeau 🚩
━━━━━━━━━━━━━━
📸 Devinez le pays de ce drapeau !
🅐 ${options.A}
🅑 ${options.B}
🅒 ${options.C}
🅓 ${options.D}

⏳ Vous avez 1 minute 30 secondes !
💡 Vous avez 3 essais ! Répondez avec A, B, C ou D.`);

      api.sendMessage(
        {
          body,
          attachment: imageStream.data
        },
        event.threadID,
        async (err, info) => {
          if (err) return;
          
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID,
            correctAnswer: answer,
            chances: 3,
            answered: false
          });

          setTimeout(async () => {
            const quizData = global.GoatBot.onReply.get(info.messageID);
            if (quizData && !quizData.answered) {
              await api.unsendMessage(info.messageID);
              const msg = await toFont(`⏰ Le temps est écoulé !
✅ La bonne réponse était : ${answer}`);
              api.sendMessage(msg, event.threadID);
              global.GoatBot.onReply.delete(info.messageID);
            }
          }, 90000);
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      const failMsg = await toFont("❌ Échec lors de la récupération des données du drapeau.");
      api.sendMessage(failMsg, event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    let { author, correctAnswer, messageID, chances } = Reply;
    const reply = event.body?.trim().toUpperCase();

    if (event.senderID !== author) {
      const msg = await toFont("⚠️ Ce quiz n'est pas pour vous !");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    if (!reply || !["A", "B", "C", "D"].includes(reply)) {
      const msg = await toFont("❌ Veuillez répondre avec A, B, C ou D.");
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    if (reply === correctAnswer) {
      await api.unsendMessage(messageID);

      const rewardCoin = 300;
      const rewardExp = 100;
      const userData = await usersData.get(event.senderID);
      userData.money += rewardCoin;
      userData.exp += rewardExp;
      await usersData.set(event.senderID, userData);

      const correctMsg = await toFont(`🎉 Félicitations !

✅ Vous avez répondu correctement !
💰 Vous avez gagné ${rewardCoin} pièces
🌟 Vous avez gagné ${rewardExp} EXP

🚩 Vous avez reconnu le bon drapeau, vous êtes le vrai champion !`);

      if (global.GoatBot.onReply.has(messageID)) {
        global.GoatBot.onReply.get(messageID).answered = true;
        global.GoatBot.onReply.delete(messageID);
      }

      return api.sendMessage(correctMsg, event.threadID, event.messageID);
    } else {
      chances--;

      if (chances > 0) {
        global.GoatBot.onReply.set(messageID, {
          ...Reply,
          chances
        });

        const wrongTryMsg = await toFont(`❌ Mauvaise réponse !
⏳ Il vous reste ${chances} essai(s). Réessayez !`);
        return api.sendMessage(wrongTryMsg, event.threadID, event.messageID);
      } else {
        await api.unsendMessage(messageID);
        const wrongMsg = await toFont(`🥺 Plus d'essais !
✅ La bonne réponse était : ${correctAnswer}`);
        return api.sendMessage(wrongMsg, event.threadID, event.messageID);
      }
    }
  }
};
