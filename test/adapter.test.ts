import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ChannelType,
  type Interaction,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from "discord.js";
import { context } from "../src/adapter.ts";
import { parseAgenda, type Session } from "../src/domain.ts";
import { panel, payload, preview } from "../src/views.ts";

function interaction(patch: Record<string, unknown> = {}) {
  const calls: { kind: string; body: unknown }[] = [];
  const i = {
    isChatInputCommand: () => true,
    isButton: () => false,
    isModalSubmit: () => false,
    commandName: "huddle",
    guildId: "guild",
    channelId: "channel",
    user: { id: "user" },
    locale: "tr",
    options: { getString: () => null },
    memberPermissions: new PermissionsBitField(PermissionFlagsBits.ManageGuild),
    appPermissions: new PermissionsBitField([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
    ]),
    channel: {
      type: ChannelType.GuildText,
      send: async (body: unknown) => {
        calls.push({ kind: "send", body });
        return {
          id: "message",
          edit: async (body: unknown) => {
            calls.push({ kind: "edit", body });
          },
        };
      },
    },
    reply: async (body: unknown) => {
      calls.push({ kind: "reply", body });
    },
    deferReply: async (body: unknown) => {
      calls.push({ kind: "defer", body });
    },
    editReply: async () => {},
    showModal: async () => {},
    ...patch,
  };
  return { c: context(i as unknown as Interaction), calls };
}
test("adapter maps locale and manager/bot channel permissions", () => {
  const { c } = interaction();
  assert.equal(c?.lang, "tr");
  assert.equal(c?.manage, true);
  assert.equal(c?.canPublish, true);
  assert.equal(interaction({ memberPermissions: null }).c?.manage, false);
  assert.equal(interaction({ appPermissions: new PermissionsBitField(0n) }).c?.canPublish, false);
});
test("private reply and defer are ephemeral while publication is ordinary", async () => {
  const { c, calls } = interaction();
  assert.ok(c);
  await c.reply(payload("Private"));
  await c.defer();
  const m = await c.publish(payload("Public"));
  await m.edit(payload("Updated"));
  assert.equal(
    (calls[0]?.body as { flags: number } | undefined)?.flags,
    MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
  );
  assert.equal((calls[1]?.body as { flags: number } | undefined)?.flags, MessageFlags.Ephemeral);
  assert.equal(
    (calls[2]?.body as { flags: number } | undefined)?.flags,
    MessageFlags.SuppressEmbeds,
  );
  assert.equal(calls[3]?.kind, "edit");
});
test("adapter forbids thread/forum/DM publication", async () => {
  for (const type of [ChannelType.PublicThread, ChannelType.GuildForum, ChannelType.DM]) {
    const { c } = interaction({ channel: { type } });
    assert.ok(c);
    assert.equal(c.canPublish, false);
    await assert.rejects(c.publish(payload("Never send")));
  }
});
test("adapter ignores unrelated command interactions", () => {
  assert.equal(interaction({ commandName: "another" }).c, undefined);
});
test("maximal agenda cards fit Discord message and button limits", () => {
  for (const lang of ["tr", "en"] as const) {
    const a = parseAgenda(
      "T".repeat(80),
      Array.from({ length: 5 }, () => `30 | ${"B".repeat(60)}`).join("\n"),
      lang,
    );
    const s: Session = {
      ...a,
      id: "00000000-0000-4000-8000-000000000001",
      guild: "g",
      channel: "c",
      message: "m",
      createdAt: 0,
      index: 0,
      phase: "ready",
      due: 0,
      remaining: 0,
    };
    for (const body of [preview(a, s.id), panel(s, 0)]) {
      assert.ok(body.content.length <= 2000);
      assert.ok(body.components[0]?.components.length <= 5);
      for (const b of body.components[0]?.components ?? []) {
        const data = b.toJSON();
        assert.ok(data.custom_id.length <= 100);
        assert.ok(data.label.length <= 80);
      }
    }
  }
});
