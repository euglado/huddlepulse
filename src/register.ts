import { REST, Routes } from "discord.js";
import { command } from "./commands.ts";
import { config } from "./config.ts";

async function register() {
  const c = config();
  try {
    // Upsert only this named command; do not replace other application commands.
    await new REST({ version: "10" })
      .setToken(c.token)
      .post(Routes.applicationGuildCommands(c.clientId, c.guildId), { body: command });
    console.log("/huddle hazır. / /huddle registered in your configured server.");
  } catch {
    console.error(
      "Komut kaydı başarısız. Token, Application ID, Server ID ve bot davetini kontrol edin. / Registration failed; check token, IDs and server installation. Details withheld to protect credentials.",
    );
    process.exitCode = 1;
  }
}
register().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : "Configuration failed");
  process.exitCode = 1;
});
