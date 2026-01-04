const { Client, GatewayIntentBits, ChannelType } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

// ===== CONFIG =====
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const MUSIC_PATH = path.join(__dirname, "music.mp3");

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ===== READY =====
client.once("ready", async () => {
  console.log("🚀 BOT READY :", client.user.tag);

  // 🔍 Vérifs de base
  console.log("GUILD_ID =", GUILD_ID);
  console.log("VOICE_CHANNEL_ID =", VOICE_CHANNEL_ID);
  console.log("MP3 exists =", fs.existsSync(MUSIC_PATH));

  if (!fs.existsSync(MUSIC_PATH)) {
    console.error("❌ music.mp3 introuvable");
    return;
  }

  try {
    // 🔹 Fetch serveur
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log("✅ Serveur trouvé :", guild.name);

    // 🔹 Fetch salon vocal (PAS le cache)
    const channel = await guild.channels.fetch(VOICE_CHANNEL_ID);

    if (!channel || channel.type !== ChannelType.GuildVoice) {
      console.error("❌ Le salon n'est PAS un salon vocal");
      return;
    }

    console.log("🔊 Salon vocal :", channel.name);

    // 🔹 Connexion vocale
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    connection.on("stateChange", (o, n) => {
      console.log("VOICE STATE :", o.status, "→", n.status);
    });

    // 🔹 Player audio
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    const playMusic = () => {
      console.log("🎵 Lancement musique");

      const resource = createAudioResource(MUSIC_PATH, {
        inlineVolume: true,
      });

      resource.volume.setVolume(0.5); // volume 50 %
      player.play(resource);
      connection.subscribe(player);
    };

    // ▶️ Start
    playMusic();

    // 🔁 Loop 24/7
    player.on(AudioPlayerStatus.Idle, () => {
      console.log("🔁 Musique terminée, relance");
      playMusic();
    });

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("🎶 Musique en cours");
    });

    player.on("error", (err) => {
      console.error("❌ Erreur audio :", err);
    });

  } catch (err) {
    console.error("❌ Erreur générale :", err);
  }
});

// ===== LOGIN =====
client.login(TOKEN);
