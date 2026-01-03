require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");

const googleTTS = require("google-tts-api");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const VOLUME = 0.15;

const TTS_TEXT = `Bonjour et bienvenue sur TFR, merci de patienter.
Un membre du staff sera là dans quelques instants.
Si l’attente est trop longue, vous pouvez créer un ticket, question ou autre selon votre demande.
Merci de votre patience.`;

let connection = null;
let player = null;
let voiceChannel = null;
let hasPlayedTTS = false;

client.once("ready", () => {
  console.log(`✅ Bot en ligne : ${client.user.tag}`);
});

function playMusicLoop() {
  if (!voiceChannel || !player) return;

  const humans = voiceChannel.members.filter(m => !m.user.bot).size;
  if (humans === 0) return;

  const resource = createAudioResource(
    fs.createReadStream("attente.mp3"),
    { inlineVolume: true }
  );

  resource.volume.setVolume(VOLUME);
  player.play(resource);
}

async function playTTS() {
  const url = googleTTS.getAudioUrl(TTS_TEXT, {
    lang: "fr",
    slow: false,
    host: "https://translate.google.com",
  });

  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  const tts = createAudioResource(buffer, { inlineVolume: true });
  tts.volume.setVolume(VOLUME);
  player.play(tts);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!setup") return;

  const channel = message.member.voice.channel;
  if (!channel) {
    return message.reply("❌ Tu dois être dans un salon vocal.");
  }

  voiceChannel = channel;
  hasPlayedTTS = false;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  player = createAudioPlayer();
  connection.subscribe(player);

  message.reply("✅ Bot installé dans le salon vocal (24/7).");
});

client.on("voiceStateUpdate", () => {
  if (!voiceChannel || !player) return;

  const humans = voiceChannel.members.filter(m => !m.user.bot).size;

  if (humans > 0 && player.state.status === AudioPlayerStatus.Idle) {
    if (!hasPlayedTTS) {
      hasPlayedTTS = true;
      playTTS();
    } else {
      playMusicLoop();
    }
  }

  if (humans === 0) {
    hasPlayedTTS = false;
    player.stop();
  }
});

setTimeout(() => {
  if (!player) return;

  player.on(AudioPlayerStatus.Idle, () => {
    playMusicLoop();
  });
}, 500);

client.login(process.env.TOKEN);