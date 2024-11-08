import Discord from 'discord.js';
import { Config } from './config';

const config = new Config();

export type RoleName = 'guest' | 'verified';

const validateEmail = 'Para validar seu email, clique no link:';
const validateEmailMessage = `Olá, seja bem-vindo ao servidor! ${validateEmail} ${config.oauth2Link}`;

export const client = new Discord.Client({ 
  intents: [
    'GuildModeration', 
    'GuildMembers',
    'MessageContent',
    'AutoModerationConfiguration',
    'AutoModerationExecution',
    'DirectMessageReactions',
    'DirectMessages',
    'GuildMessages',
    'Guilds',
    'GuildIntegrations',
  ]
});

client.on('messageCreate', async (message) => {
  if (message.content === '&ping') {
    message.reply('Pong!');
  }
  if (message.content === '&validar') {
    message.reply(validateEmailMessage);
  }
});

client.on("ready", async (c) => {
  c.channels.fetch(config.waitingRoomChannelId).then(channel => {
    let hasWelcomeMessageFromBot = false;
    if (channel && channel.isSendable()) {
      channel.messages.fetch().then(messages => {
        if (messages.size === 0) {
          channel.send(validateEmailMessage);
          return;
        }
        messages.forEach(message => {
          if(message.author.displayName === client.user?.username && message.content.includes('validar seu email')) {
            console.log('Bot welcome message found');
            hasWelcomeMessageFromBot = true;
            return;
          }
        });
        if (!hasWelcomeMessageFromBot) {
          channel.send(validateEmailMessage);
        }
      });
    }
  });
});

client.on('guildMemberUpdate', async (_) => {
  console.log('guildMemberUpdate');
});

client.on('guildMemberAdd', async (member) => {
  await addRole('guest', member);
})

export const getMemberInGuild = async (memberId: string) => {
  try {
    if(!client.isReady()) {
      console.error('Client is not ready');
      return;
    }
    const guild = await client.guilds.fetch(config.guildId);
    const member = await guild.members.fetch(memberId);
    console.log('member', member.id, member.displayName);
    return member;
  } catch (e) {
    console.error('Error getting member in guild', e);
  }
}

export const addRole = async (roleName: RoleName, member: Discord.GuildMember) => {
  try {
    const roleId = config.roles[roleName];
    console.log('add roleId in member', member.id, member.displayName);
    const role = await member.guild?.roles?.fetch(roleId);
    if (!role) {
      console.error('Role not found');
      return;
    }
    await member.roles.add(role);
  } catch (e) {
    console.error('Error adding role', e);
  }
}

export const removeRole = async (roleName: RoleName, member: Discord.GuildMember) => {
  try {
    const roleId = new Config().roles[roleName];
    console.log('remove roleId in member', member.id, member.displayName);
    const role = await member.guild?.roles?.fetch(roleId);
    if (!role) {
      console.error('Role not found');
      return;
    }
    await member.roles.remove(role);
  } catch (e) {
    console.error('Error removing role', e);
  }
}
