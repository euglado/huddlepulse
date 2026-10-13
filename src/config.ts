export function config(env: NodeJS.ProcessEnv = process.env) {
  const token = env.DISCORD_TOKEN?.trim() ?? "";
  const clientId = env.DISCORD_CLIENT_ID?.trim() ?? "";
  const guildId = env.DISCORD_GUILD_ID?.trim() ?? "";
  if (
    !/^[\w.-]{20,250}$/u.test(token) ||
    token.startsWith("replace_") ||
    !/^\d{17,20}$/u.test(clientId) ||
    !/^\d{17,20}$/u.test(guildId)
  )
    throw new Error(
      "Önce setup.cmd veya ./setup.sh çalıştırın. / Run setup.cmd or ./setup.sh first. Keep the bot token private.",
    );
  return { token, clientId, guildId };
}
