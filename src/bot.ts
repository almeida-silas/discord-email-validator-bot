import Discord from 'discord.js';
import { Config } from './config';

const config = new Config();

export type RoleName = 'guest' | 'verified';

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
    message.reply('Para validar seu email, clique no link: ' + config.oauth2Link);
  }
});

client.on("ready", async () => {});

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
    console.log('member', member);
    return member;
  } catch (e) {
    console.error('Error getting member in guild', e);
  }
}

export const addRole = async (roleName: RoleName, member: Discord.GuildMember | string) => {
  try {
    if (typeof member === 'string') {
      const memberGuild = await getMemberInGuild(member);
      if (!memberGuild) {
        console.error('Member guild not found');
        return;
      }
      member = memberGuild;
    }
    const roleId = config.roles[roleName];
    console.log('add roleId in member', member);
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

export const removeRole = async (roleName: RoleName, member: Discord.GuildMember | string) => {
  try {
    if (typeof member === 'string') {
      const memberGuild = await getMemberInGuild(member);
      if (!memberGuild) {
        console.error('Member guild not found');
        return;
      }
      member = memberGuild;
    }
    const roleId = new Config().roles[roleName];
    console.log('remove roleId in member', member);
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
