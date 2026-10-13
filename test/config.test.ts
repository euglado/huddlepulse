import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { command } from "../src/commands.ts";
import { config } from "../src/config.ts";

test("missing config emits safe setup instructions", () => {
  assert.throws(() => config({}), /setup.cmd/u);
});
test("configuration rejects placeholders and invalid IDs", () => {
  assert.throws(() =>
    config({
      DISCORD_TOKEN: "replace_with_your_bot_token",
      DISCORD_CLIENT_ID: "12345678901234567",
      DISCORD_GUILD_ID: "12345678901234567",
    }),
  );
});
test("guild command defaults to managers without global-only fields", () => {
  assert.equal(command.default_member_permissions, "32");
  assert.equal(command.name, "huddle");
  assert.equal(command.contexts, undefined);
  assert.equal(command.integration_types, undefined);
});
for (const entry of ["dist/main.js", "dist/register.js"]) {
  test(`${entry} without credentials exits before network login`, () => {
    const result = spawnSync(process.execPath, [entry], {
      encoding: "utf8",
      env: { ...process.env, DISCORD_TOKEN: "", DISCORD_CLIENT_ID: "", DISCORD_GUILD_ID: "" },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /setup.cmd/u);
  });
}
test("noninteractive setup exits without creating configuration", () => {
  const before = existsSync(".env");
  const result = spawnSync(process.execPath, ["scripts/setup.mjs"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /interactive terminal/u);
  assert.equal(existsSync(".env"), before);
});
