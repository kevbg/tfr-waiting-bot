const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const fs = require("fs");
const path = require("path");

// ====== CONFIG ======
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const MUSIC_PATH = path.join(__dirname, "music.mp3");

// ====== CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ====== READY ======
client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  // 🔍 Vérification MP3
  console.log("MP3 exists:", fs.existsSync(MUSIC_PATH));

  if (!fs.existsSync(MUSIC_PATH)) {
    console.error("❌ music.mp3 introuvable !");
    return;
  }

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

  if (!channel) {
    console.error("❌ Salon vocal introuvable");
    return;
  }

  // 🔊 Connexion vocale
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  // 🎵 Player audio
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  });

  const playMusic = () => {
    const resource = createAudioResource(MUSIC_PATH, {
      inlineVolume: true,
    });

    resource.volume.setVolume(0.5); // 🔊 volume (0.0 à 1.0)

    player.play(resource);
    connection.subscribe(player);
  };

  // ▶️ Lancement
  playMusic();

  // 🔁 Boucle infinie
  player.on(AudioPlayerStatus.Idle, () => {
    console.log("🔁 Relance de la musique");
    playMusic();
  });

  player.on(AudioPlayerStatus.Playing, () => {
    console.log("🎵 Musique en lecture");
  });

  player.on("error", (err) => {
    console.error("❌ Erreur audio :", err);
  });
});

// ====== LOGIN ======
client.login(TOKEN);
