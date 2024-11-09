export class Config {
  port = process.env.PORT || 3000;
  baseUrl = process.env.BASE_URL || "https://discord.com";
  apiBaseUrl = `${this.baseUrl}/api/v10`;
  guestRoleId = process.env.GUEST_ROLE_ID!;
  verifiedRoleId = process.env.VERIFIED_ROLE_ID!;
  oauth2Url = `${this.baseUrl}/oauth2/authorize`;
  clientId = process.env.CLIENT_ID!;
  clientSecret = process.env.CLIENT_SECRET!;
  redirectUri = process.env.REDIRECT_URI!;
  discordToken = process.env.DISCORD_TOKEN!;
  guildId = process.env.GUILD_ID!;
  emailDomainsAllowed = process.env.ALLOWED_DOMAINS?.split(",") || [];
  oauth2Link = `${this.oauth2Url}?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=identify%20email`;
  waitingRoomChannelId = process.env.WAITING_ROOM_CHANNEL_ID!;
  sendWelcomeMessage = process.env.SEND_WELCOME_MESSAGE === "true";
  welcomeMessageChannelId = process.env.WELCOME_CHANNEL_ID!;
  secondsToKick = Number(process.env.SECONDS_TO_KICK || 300);
  checkPendingMembersInterval = Number(
    process.env.CHECK_PENDING_MEMBERS_INTERVAL || 1000 * 60 * 60
  );

  roles = {
    guest: this.guestRoleId,
    verified: this.verifiedRoleId,
  };

  constructor() {
    if (
      !this.port ||
      !this.baseUrl ||
      !this.apiBaseUrl ||
      !this.guestRoleId ||
      !this.verifiedRoleId ||
      !this.oauth2Url ||
      !this.clientId ||
      !this.clientSecret ||
      !this.waitingRoomChannelId ||
      !this.redirectUri ||
      !this.discordToken ||
      !this.guildId ||
      !this.emailDomainsAllowed.length ||
      (this.sendWelcomeMessage && !this.welcomeMessageChannelId)
    ) {
      throw new Error("bad config");
    }
  }
}
