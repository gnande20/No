const axios = require("axios");

const baseApiUrl = "https://www.noobs-api.rf.gd/dipto";

module.exports = {
  config: {
    name: "spy",
    aliases: ["hackerspy"],
    version: "1.2",
    role: 0,
    author: "Christus",
    description: "Get user information and profile photo",
    category: "information",
    countDown: 10,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      // get caller id and mentioned id if any
      const uid1 = event.senderID;
      const uid2 =
        event.mentions && Object.keys(event.mentions).length
          ? Object.keys(event.mentions)[0]
          : null;

      // parse uid from args (plain id or profile.php?id=123)
      let uid;
      if (args && args[0]) {
        if (/^\d+$/.test(args[0])) {
          uid = args[0];
        } else {
          const match = args[0].match(/profile\.php\?id=(\d+)/);
          if (match) uid = match[1];
        }
      }

      // fallback to reply, mention, or self
      if (!uid) {
        uid =
          event.type === "message_reply"
            ? event.messageReply?.senderID
            : uid2 || uid1;
      }

      // fetch remote "baby" data safely
      let babyTeach = 0;
      try {
        const response = await axios.get(`${baseApiUrl}/baby?list=all`);
        const dataa = response?.data || {};
        babyTeach =
          dataa?.teacher?.teacherList?.find((t) => t?.[uid])?.[uid] || 0;
      } catch (e) {
        babyTeach = 0;
      }

      // fetch user info and local db info
      const userInfo = (await api.getUserInfo(uid)) || {};
      const info = userInfo[uid] || {};

      // avatar fallback
      let avatarUrl = null;
      try {
        avatarUrl = (await usersData.getAvatarUrl(uid)) || null;
      } catch (e) {
        avatarUrl = null;
      }

      if (!avatarUrl) {
        avatarUrl = "https://i.imgur.com/TPHk4Qu.png"; // placeholder
      }

      // gender text mapping with neutral default
      let genderText = "⚧️ Unknown";
      switch (info.gender) {
        case 1:
          genderText = "👩 Female";
          break;
        case 2:
          genderText = "👨 Male";
          break;
        default:
          genderText = "⚧️ Unknown";
      }

      // local usersData record (money, exp, etc.)
      const userRecord = (await usersData.get(uid)) || {};
      const money = Number(userRecord.money || 0);
      const exp = Number(userRecord.exp || 0);
      const allUser = (await usersData.getAll()) || [];

      // ranks (safe)
      const rank =
        allUser.length > 0
          ? allUser
              .slice()
              .sort((a, b) => (b.exp || 0) - (a.exp || 0))
              .findIndex((u) => String(u.userID) === String(uid)) + 1
          : 0;
      const moneyRank =
        allUser.length > 0
          ? allUser
              .slice()
              .sort((a, b) => (b.money || 0) - (a.money || 0))
              .findIndex((u) => String(u.userID) === String(uid)) + 1
          : 0;

      // profile / account status info from API
      const accountType = info.type ? String(info.type).toUpperCase() : "User";
      const isFriend = info.isFriend ? "✅ Yes" : "❌ No";
      const isBirthday =
        typeof info.isBirthday !== "undefined" && info.isBirthday !== false
          ? info.isBirthday
          : "Private";

      // try to get thread/group info if available
      let threadInfo = {};
      try {
        if (event.isGroup && event.threadID) {
          threadInfo = (await api.getThreadInfo(event.threadID)) || {};
        }
      } catch (e) {
        threadInfo = {};
      }

      // format date/time in Africa/Abidjan
      const now = new Date();
      const localeOpts = {
        timeZone: "Africa/Abidjan",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      const reportDate = new Intl.DateTimeFormat("en-GB", localeOpts).format(
        now
      );

      // build the formatted message to match the example layout
      const userInformation = [
        "𝐒𝐏𝐘",
        "━━━━━━━━━━━━",
        "",
        "👤 𝐏𝐄𝐑𝐒𝐎𝐍𝐀𝐋 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍",
        `📝 𝖥𝗎𝗅𝗅 𝖭𝖺𝗆𝖾: ${info?.name || userRecord?.name || "Unknown"}`,
        `👤 𝖥𝗂𝗋𝗌𝗍 𝖭𝖺𝗆𝖾: ${extractFirstName(info?.name || userRecord?.name)}`,
        `👥 𝖫𝖺𝗌𝗍 𝖭𝖺𝗆𝖾: ${extractLastName(info?.name || userRecord?.name)}`,
        `🆔 𝖴𝗌𝖾𝗋 𝖨𝖣: ${uid}`,
        `⚧️ 𝖦𝖾𝗇𝖽𝖾𝗋: ${genderText}`,
        `🔗 𝖴𝗌𝖾𝗋𝗇𝖺𝗆𝖾: ${info?.vanity || "Not set"}`,
        `🎂 𝖡𝗂𝗋𝗍𝗁𝖽𝖺𝗒: ${isBirthday}`,
        `🌐 𝖯𝗋𝗈𝖿𝗂𝗅𝖾 𝖴𝖱𝖫: ${info?.profileUrl || "Not available"}`,
        "",
        "📱 𝐀𝐂𝐂𝐎𝐔𝐍𝐓 𝐒𝐓𝐀𝐓𝐔𝐒",
        `🏷️ 𝖠𝖼𝖼𝗈𝗎𝗇𝗍 𝖳𝗒𝗉𝖾: ${accountType}`,
        `✅ 𝖵𝖾𝗋𝗂𝖿𝗂𝖼𝖺𝗍𝗂𝖔𝗇: ${info?.is_verified ? "✅ Verified" : "❌ Not verified"}`,
        `👥 𝖥𝗋𝗂𝖾𝗇𝖽𝗌𝗁𝗂𝗉: ${isFriend}`,
        `🚫 𝖡𝖺𝗇𝗻𝖾𝖽: ${info?.is_suspended ? "✅ Yes" : "✅ No"}`,
        "",
        "🤖 𝐁𝐎𝐓 𝐃𝐀𝐓𝐀𝐁𝐀𝐒𝐄",
        `📅 𝖥𝗂𝗋𝗌𝗍 𝖩𝗈𝗂𝗇𝖾𝖽: ${userRecord?.firstJoin || "Unknown"}`,
        `🔄 𝖫𝖺𝗌𝗍 𝖴𝗉𝖽𝖺𝗍𝖾: ${userRecord?.lastUpdate || reportDate}`,
        `💰 𝖡𝖺𝗅𝖺𝗇𝖼𝖾: ${formatMoney(money)}`,
        `⭐ 𝖤𝗑𝗉𝖾𝗋𝗂𝖾𝗇𝖼𝖾: ${exp || 0} XP`,
        `🎯 𝖫𝖾𝗏𝖾𝗅: ${userRecord?.level || "N/A"}`,
        `📈 𝖭𝖾𝗑𝖙 𝖫𝖾𝗏𝖾𝗅: ${userRecord?.nextLevelXP || "N/A"}`,
        "",
        "💬 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍",
        `🏷️ 𝖭𝗂𝖼𝗄𝗇𝖺𝗆𝖾: ${threadInfo?.nicknames?.[uid] || "Not set"}`,
        `📅 𝖩𝗈𝗂𝗇𝖾𝖽 𝖦𝗋𝗈𝗎𝗉: ${threadInfo?.participantIDs && threadInfo.participantIDs.includes(uid) ? "Joined" : "Unknown"}`,
        `👑 𝖠𝖽𝗆𝗂𝗇 𝖲𝗍𝖺𝗍𝖚𝗌: ${threadInfo?.adminIDs && threadInfo.adminIDs.includes(uid) ? "✅ Admin" : "❌ Member"}`,
        `💬 𝖬𝖾𝗌𝖲𝖺𝗀𝖾𝗌 𝖲𝖾𝗇𝗍: ${userRecord?.messages || 0}`,
        `📍 𝖦𝗋𝗈𝗎𝗉 𝖭𝖺𝗆𝖾: ${threadInfo?.threadName || "Unknown"}`,
        "",
        "📊 𝐏𝐑𝐎𝐅𝐈𝐋𝐄 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐂𝐒",
        `🌟 𝖯𝗋𝗈𝖿𝗂𝗅𝖾 𝖲𝖼𝗈𝗋𝖾: ${userRecord?.profileScore || "N/A"}`,
        `🏆 𝖴𝗌𝖾𝗋 𝖱𝖺𝗇𝗄: ${rank > 0 ? `#${rank}` : "Not ranked"}`,
        `📈 𝖤𝖷𝖯 𝖱𝖺𝗇𝗄𝗂𝗇𝗀: ${userRecord?.expRank || "N/A"}`,
        `💰 𝖬𝗈𝗇𝖾𝗒 𝖱𝖺𝗇𝗄𝗂𝗇𝗀: ${moneyRank > 0 ? `#${moneyRank}` : "Not ranked"}`,
        `🕐 𝑅𝑒𝑝𝑜𝑟𝑡 𝐺𝑒𝑛𝑒𝑟𝑎𝑡𝑒𝑑: ${reportDate}`,
      ].join("\n");

      // send reply with avatar attachment
      await message.reply({
        body: userInformation,
        attachment: await global.utils.getStreamFromURL(avatarUrl),
      });
    } catch (err) {
      console.error("SPY command error:", err);
      return message.reply("❌ An error occurred while fetching user info.");
    }
  },
};

// --- helpers ---
function extractFirstName(full) {
  if (!full) return "Unknown";
  const parts = String(full).trim().split(/\s+/);
  return parts[0] || "Unknown";
}
function extractLastName(full) {
  if (!full) return "";
  const parts = String(full).trim().split(/\s+/);
  return parts.slice(1).join(" ") || "";
}
function formatMoney(num) {
  num = Number(num) || 0;
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return (Math.round(num * 10) / 10).toString().replace(/\.0$/, "") + units[unit];
                        }
