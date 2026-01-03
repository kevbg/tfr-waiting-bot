const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// 🔐 Variables Railway
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const VOLUME = Number(process.env.VOLUME || 0.5); // 0.0 → 1.0

function playLoop(player) {
  const resource = createAudioResource(
    path.join(__dirname, 'music.mp3'),
    { inlineVolume: true }
  );

  resource.volume.setVolume(VOLUME);
  player.play(resource);
}

client.once('ready', () => {
  console.log(`🎧 Bot connecté : ${client.user.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return console.error('❌ Serveur introuvable');

  const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
  if (!channel) return console.error('❌ Salon vocal introuvable');

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  const player = createAudioPlayer();

  playLoop(player);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    console.log('🔁 Relecture de la musique');
    playLoop(player);
  });
});

client.login(TOKEN);