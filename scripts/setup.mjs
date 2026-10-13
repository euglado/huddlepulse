import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const target = fileURLToPath(new URL("../.env", import.meta.url));
const [major, minor] = process.versions.node.split(".").map(Number);
if (major !== 24 || minor < 13) {
  console.error("Önce Node.js 24.13+ LTS kurun. / Install Node.js 24.13+ LTS first (below 25).");
  process.exitCode = 1;
} else if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(
    "Etkileşimli terminal gerekir. / Open an interactive terminal to enter your token safely.",
  );
  process.exitCode = 1;
} else {
  let rl;
  try {
    console.log(
      "HuddlePulse kurulumu / setup. Existing .env is never overwritten. Ctrl+C cancels.",
    );
    rl = createInterface({ input: process.stdin, output: process.stdout });
    const client = (await rl.question("Application ID: ")).trim();
    const guild = (await rl.question("Server ID: ")).trim();
    rl.close();
    rl = undefined;
    if (!/^\d{17,20}$/u.test(client) || !/^\d{17,20}$/u.test(guild)) throw new Error("ids");
    process.stdout.write("Bot token (hidden / gizli): ");
    const token = await new Promise((resolve, reject) => {
      let value = "";
      const cleanup = () => {
        process.stdin.setRawMode(false);
        process.stdin.off("data", input);
        process.stdin.pause();
        process.stdout.write("\n");
      };
      const input = (chunk) => {
        for (const ch of chunk.toString()) {
          if (ch === "\u0003") {
            cleanup();
            reject(new Error("cancel"));
            return;
          }
          if (ch === "\r" || ch === "\n") {
            cleanup();
            resolve(value.trim());
            return;
          }
          if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
          else if (/[\w.-]/u.test(ch) && value.length < 250) value += ch;
        }
      };
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", input);
    });
    if (!/^[\w.-]{20,250}$/u.test(token) || token.startsWith("replace_")) throw new Error("token");
    await writeFile(
      target,
      `DISCORD_TOKEN=${token}\nDISCORD_CLIENT_ID=${client}\nDISCORD_GUILD_ID=${guild}\n`,
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      ".env oluşturuldu; gizli tutun. / .env created; keep it private. Permissions requested: View Channel + Send Messages (3072).",
    );
    console.log(
      `Invite / Davet: https://discord.com/oauth2/authorize?client_id=${client}&scope=bot%20applications.commands&permissions=3072`,
    );
  } catch {
    console.error(
      "Kurulum tamamlanmadı. Kimlikleri kontrol edin; mevcut .env dosyası varsa güvenle taşıyıp tekrar deneyin. / Setup not completed. Check IDs; if .env already exists, move it safely before retrying. No token or error details printed.",
    );
    process.exitCode = 1;
  } finally {
    rl?.close();
  }
}
