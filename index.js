const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");

// ====== CONFIG ======
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const MUSIC_PATH = path.join(__dirname, "music.mp3");

// ====== LOGS DE DEBUG ======
console.log("GUILD_ID =", GUILD_ID);
console.log("VOICE_CHANNEL_ID =", VOICE_CHANNEL_ID);
console.log("MP3 exists =", fs.existsSync(MUSIC_PATH));

if (!fs.existsSync(MUSIC_PATH)) {
  console.error("❌ music.mp3 introuvable !");
  process.exit(1);
}

// ====== CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once("ready", async () => {
  console.log(`🚀 BOT READY : ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  if (!guild) {
    console.error("❌ Serveur introuvable");
    return;
  }

  const channel = await guild.channels.fetch(VOICE_CHANNEL_ID);
  if (!channel || channel.type !== 2) {
    console.error("❌ Salon vocal invalide");
    return;
  }

  console.log("🔊 Connexion au salon vocal :", channel.name);

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
  });

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

    resource.volume.setVolume(0.5); // volume 50%
    player.play(resource);
  };

  player.on(AudioPlayerStatus.Idle, () => {
    console.log("🔁 Replay musique");
    playMusic();
  });

  player.on("error", (err) => {
    console.error("❌ Erreur audio :", err);
  });

  connection.subscribe(player);
  playMusic();
});

// ====== LOGIN ======
client.login(TOKEN);
