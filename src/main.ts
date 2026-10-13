import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { context } from "./adapter.ts";
import { config } from "./config.ts";
import { MeetingService } from "./service.ts";

async function main() {
  const c = config();
  const service = new MeetingService(c.guildId);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [] },
    makeCache: Options.cacheWithLimits({ MessageManager: 0 }),
  });
  let timer: ReturnType<typeof setInterval> | undefined;
  client.once(Events.ClientReady, () => {
    console.log("HuddlePulse çevrimiçi. / HuddlePulse online. Restart ends active agendas.");
    timer = setInterval(() => {
      void service
        .tick()
        .catch(() => console.error("Timer cleanup failed; no private details logged."));
    }, 5000);
    timer.unref();
  });
  client.on(Events.InteractionCreate, (i) => {
    void (async () => {
      const c = context(i);
      if (c) await service.handle(c);
    })().catch(() => console.error("Interaction could not complete; no private details logged."));
  });
  client.on(Events.Error, () =>
    console.error("Discord connection error; check connectivity and bot permissions."),
  );
  const stop = () => {
    if (timer) clearInterval(timer);
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    await client.login(c.token);
  } catch {
    stop();
    console.error(
      "Discord bağlantısı kurulamadı. Tokenı ve ağı kontrol edin. / Login failed; check token and network. Token and error details withheld.",
    );
    process.exitCode = 1;
  }
}
main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : "Configuration failed");
  process.exitCode = 1;
});
