import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const lock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
const allowed = new Set([
  "MIT",
  "Apache-2.0",
  "MIT OR Apache-2.0",
  "0BSD",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
]);
let dependencies = 0;
for (const [name, p] of Object.entries(lock.packages)) {
  if (!name) continue;
  assert.ok(allowed.has(p.license), `Unreviewed license in ${name}`);
  assert.ok(
    p.resolved?.startsWith("https://registry.npmjs.org/"),
    `Unreviewed registry in ${name}`,
  );
  assert.match(
    p.integrity ?? "",
    /^sha512-[A-Za-z0-9+/]+={0,2}$/u,
    `Missing SHA-512 integrity in ${name}`,
  );
  assert.ok(!p.hasInstallScript, `Unexpected dependency install script in ${name}`);
  dependencies++;
}
const patterns = [
  /mfa\.[\w-]{60,}/u,
  /[A-Za-z\d_-]{23,28}\.[A-Za-z\d_-]{6}\.[A-Za-z\d_-]{27,}/u,
  /gh[pousr]_[A-Za-z\d]{30,}/u,
  /github_pat_[A-Za-z\d_]{40,}/u,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /DISCORD_TOKEN\s*=\s*[^\s`$]{20,}/u,
];
let files = 0;
async function scan(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (
      ["node_modules", ".git", "dist", "coverage"].includes(e.name) ||
      (e.name.startsWith(".env") && e.name !== ".env.example")
    )
      continue;
    assert.ok(!e.isSymbolicLink(), "Source symlinks require manual review");
    const file = path.join(dir, e.name);
    if (e.isDirectory()) {
      await scan(file);
      continue;
    }
    // All repository files in this project are UTF-8 text.
    const text = await readFile(file, "utf8");
    const relative = path.relative(root, file);
    const safe =
      relative === ".env.example"
        ? text
            .split("\n")
            .filter((line) => !line.startsWith("DISCORD_TOKEN="))
            .join("\n")
        : text;
    assert.ok(
      patterns.every((p) => !p.test(safe)),
      `Possible credential pattern in ${relative}; value withheld`,
    );
    files++;
  }
}
await scan(root);
console.log(
  `Supply checks passed: ${dependencies} dependency licenses/registry/SHA-512 entries; ${files} source credential-pattern checks. Pattern matching is not a complete secret audit.`,
);
