import Discord from "discord.js";
import moment from "moment";

import { Config } from "./config";

const config = new Config();

export type RoleName = "guest" | "verified";

const validateEmail = "Para validar seu email, clique no link:";
const validateEmailMessage = `Olá, seja bem-vindo ao servidor! ${validateEmail} ${config.oauth2Link}`;

export class Bot {
  private guild?: Discord.Guild;
  private client: Discord.Client;

  constructor() {
    this.client = new Discord.Client({
      intents: [
        "GuildModeration",
        "GuildMembers",
        "MessageContent",
        "AutoModerationConfiguration",
        "AutoModerationExecution",
        "DirectMessageReactions",
        "DirectMessages",
        "GuildMessages",
        "Guilds",
        "GuildIntegrations",
      ],
    });
  }

  init() {
    this.client.login(config.discordToken);

    this.client.on("messageCreate", async (message) => {
      if (message.content === "&ping") {
        message.reply("Pong!");
      }
      if (message.content === "&validar") {
        message.reply(validateEmailMessage);
      }
    });

    setInterval(async () => {
      await this.checkPendingMembers();
    }, config.checkPendingMembersInterval);

    this.client.on("ready", async (clientInstance) => {
      console.log("Bot is ready");
      await this.getGuild();
      this.checkPendingMembers();

      const channel = await clientInstance.channels.fetch(
        config.waitingRoomChannelId
      );
      let hasWelcomeMessageFromBot = false;
      if (channel && channel.isSendable()) {
        const messages = await channel.messages.fetch();
        if (messages.size === 0) {
          channel.send(validateEmailMessage);
          return;
        }
        messages.forEach((message) => {
          if (
            message.author.displayName === this.client.user?.username &&
            message.content.includes("validar seu email")
          ) {
            console.log("Bot welcome message found");
            hasWelcomeMessageFromBot = true;
            return;
          }
        });
        if (!hasWelcomeMessageFromBot) {
          channel.send(validateEmailMessage);
        }
      }
    });

    this.client.on("guildMemberAdd", async (member) => {
      await this.addRole("guest", member);
    });
  }

  async checkPendingMembers() {
    console.log("Checking pending members with role %s", config.roles.guest);
    const members = await this.guild?.members.fetch();
    if (!members) {
      return;
    }
    members.forEach(async (member) => {
      if (member.user.bot || !member.moderatable) {
        return;
      }
      console.log(
        "Checking member %s roles %s",
        member.displayName,
        member.roles.cache.size
      );
      if (member.roles.cache.size === 1) {
        console.log("Member %s has no roles", member.displayName);
        this.addRole("guest", member);
      }
      const canBeKicked =
        member.roles.cache.size === 2 &&
        member.roles.cache.has(config.roles.guest);
      const diff = moment().diff(member.joinedAt, "s");
      const timeToKick = diff >= config.secondsToKick;
      if (canBeKicked && member.joinedAt && timeToKick) {
        console.log(
          "Kicking member %s member since %s",
          member.displayName,
          moment(member.joinedAt).format()
        );
        member.kick("Tempo de permanência expirado pois não validou o email");
      }
    });
  }

  async getRoleById(roleId: string) {
    return this.guild!.roles.fetch(roleId);
  }

  async getGuild() {
    if (this.guild) {
      return this.guild;
    }
    const guild = await this.client.guilds.fetch(config.guildId)!;
    this.guild = guild;
    return guild;
  }

  async getMemberInGuild(memberId: string) {
    try {
      return this.guild!.members.fetch(memberId);
    } catch (e) {
      console.error("Error getting member in guild", e);
      return;
    }
  }

  async addRole(roleName: RoleName, member: Discord.GuildMember) {
    try {
      const roleId = config.roles[roleName];
      console.log("add roleId in member", member.id, member.displayName);
      const role = await this.getRoleById(roleId);
      if (!role) {
        console.error("Role not found");
        return;
      }
      await member.roles.add(role);
    } catch (e) {
      console.error("Error adding role", e);
    }
  }

  async removeRole(roleName: RoleName, member: Discord.GuildMember) {
    try {
      const roleId = config.roles[roleName];
      console.log("remove roleId in member", member.id, member.displayName);
      const role = await this.getRoleById(roleId);
      if (!role) {
        console.error("Role not found");
        return;
      }
      await member.roles.remove(role);
    } catch (e) {
      console.error("Error removing role", e);
    }
  }

  async getChannelById(channelId: string) {
    return this.client.channels.fetch(channelId);
  }
}
