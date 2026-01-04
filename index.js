// ===== OBLIGATOIRE POUR RAILWAY =====
require('opusscript');

const fs = require('fs');
const path = require('path');

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

// ===== VARIABLES =====
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID;

const MP3_PATH = path.join(__dirname, 'attente.mp3');

// ===== CHECK =====
console.log('GUILD_ID =', GUILD_ID);
console.log('VOICE_CHANNEL_ID =', VOICE_CHANNEL_ID);
console.log('MP3 exists =', fs.existsSync(MP3_PATH));

if (!fs.existsSync(MP3_PATH)) {
  console.error('❌ attente.mp3 introuvable !');
  process.exit(1);
}

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ===== AUDIO PLAYER =====
const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play
  }
});

// ===== READY =====
client.once('ready', async () => {
  console.log(`🚀 BOT READY : ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  if (!guild) return console.error('❌ Serveur introuvable');

  const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
  if (!channel || channel.type !== 2) {
    return console.error('❌ Salon vocal invalide');
  }

  console.log(`🔊 Salon vocal : ${channel.name}`);

  // ===== CONNEXION VOCALE (DAVE DÉSACTIVÉ) =====
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  connection.on('stateChange', (oldState, newState) => {
    console.log(`VOICE STATE : ${oldState.status} → ${newState.status}`);
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    console.log('✅ Connecté au vocal');
  } catch (e) {
    console.error('❌ Connexion vocale échouée', e);
    return;
  }

  connection.subscribe(player);

  // ===== LECTURE MUSIQUE =====
  playMusic();
});

// ===== FONCTION MUSIQUE (LOOP 24/7) =====
function playMusic() {
  console.log('🎵 Lancement musique');

  const resource = createAudioResource(
    fs.createReadStream(MP3_PATH),
    {
      inlineVolume: true
    }
  );

  resource.volume.setVolume(0.4); // 🔊 Volume (0.1 à 1)

  player.play(resource);
}

player.on(AudioPlayerStatus.Idle, () => {
  console.log('🔁 Relance musique');
  playMusic();
});

player.on('error', error => {
  console.error('❌ Erreur audio :', error);
});

// ===== LOGIN =====
client.login(TOKEN);
