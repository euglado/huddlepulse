import assert from "node:assert/strict";
import { test } from "node:test";
import { DRAFT_TTL, TTL } from "../src/domain.ts";
import { type Context, MeetingService } from "../src/service.ts";
import { form, type Panel } from "../src/views.ts";

function fixture() {
  let now = 1000;
  let number = 0;
  let failPublish = false;
  let failEdit = false;
  const nextId = () => `00000000-0000-4000-8000-${String(++number).padStart(12, "0")}`;
  const service = new MeetingService("guild", () => now, nextId);
  const replies: Panel[] = [];
  const sent: Panel[] = [];
  const edits: Panel[] = [];
  let modal = "";
  let deferCount = 0;
  const make = (patch: Partial<Context> = {}): Context => ({
    kind: "command",
    guild: "guild",
    channel: "channel",
    user: "owner",
    message: "message",
    customId: "",
    lang: "en",
    manage: true,
    canPublish: true,
    title: "Weekly meeting",
    segments: "1 | Welcome\n2 | Discussion",
    reply: async (body) => {
      replies.push(body);
    },
    defer: async () => {
      deferCount++;
    },
    editReply: async (body) => {
      replies.push(body);
    },
    showModal: async (body) => {
      modal = body.toJSON().custom_id;
    },
    publish: async (body) => {
      if (failPublish) throw new Error("private secret");
      sent.push(body);
      return {
        id: "message",
        edit: async (next) => {
          if (failEdit) throw new Error("private secret");
          edits.push(next);
        },
      };
    },
    ...patch,
  });
  const preview = async () => {
    await service.handle(make());
    await service.handle(make({ kind: "form", customId: modal }));
    return modal.replace("hp:form:", "hp:publish:");
  };
  const publish = async () => {
    await service.handle(make({ kind: "button", customId: await preview() }));
  };
  const click = async (action: string, patch: Partial<Context> = {}) => {
    await service.handle(
      make({
        kind: "button",
        customId: `hp:${action}:${service.session?.id ?? "00000000-0000-4000-8000-000000000000"}`,
        ...patch,
      }),
    );
  };
  return {
    service,
    make,
    preview,
    publish,
    click,
    replies,
    sent,
    edits,
    get modal() {
      return modal;
    },
    get deferred() {
      return deferCount;
    },
    time: (n: number) => {
      now = n;
    },
    failPublish: () => {
      failPublish = true;
    },
    failEdit: () => {
      failEdit = true;
    },
  };
}
test("modal uses Label wrappers and distinct input IDs", () => {
  const m = form("00000000-0000-4000-8000-000000000001", "tr").toJSON();
  assert.equal(m.components.length, 2);
  assert.ok(m.components.every((c) => c.type === 18));
});
test("requires configured guild, manager and publish permission for form", async () => {
  for (const patch of [{ guild: "other" }, { manage: false }, { canPublish: false }]) {
    const f = fixture();
    await f.service.handle(f.make(patch));
    assert.equal(f.modal, "");
    assert.equal(f.service.drafts.size, 0);
  }
});
test("preview sends nothing public and contains explicit controls", async () => {
  const f = fixture();
  await f.preview();
  assert.equal(f.sent.length, 0);
  assert.match(f.replies.at(-1)?.content ?? "", /Private preview/u);
  assert.equal(f.replies.at(-1)?.components[0]?.components.length, 2);
});
test("publication rechecks permissions and draft stays private", async () => {
  const f = fixture();
  const id = await f.preview();
  await f.service.handle(f.make({ kind: "button", customId: id, manage: false }));
  assert.equal(f.sent.length, 0);
  assert.equal(f.service.session, undefined);
});
test("publication rechecks bot channel permissions", async () => {
  const f = fixture();
  const id = await f.preview();
  await f.service.handle(f.make({ kind: "button", customId: id, canPublish: false }));
  assert.equal(f.sent.length, 0);
});
test("draft binds owner, channel and guild", async () => {
  const f = fixture();
  const id = await f.preview();
  for (const patch of [{ user: "stranger" }, { channel: "other" }, { guild: "other" }])
    await f.service.handle(f.make({ kind: "button", customId: id, ...patch }));
  assert.equal(f.sent.length, 0);
});
test("expired form and preview are rejected", async () => {
  const f = fixture();
  const id = await f.preview();
  f.time(1000 + DRAFT_TTL);
  await f.service.handle(f.make({ kind: "button", customId: id }));
  assert.equal(f.sent.length, 0);
  assert.equal(f.service.drafts.size, 0);
});
test("preview can publish once and suppresses mentions and embeds", async () => {
  const f = fixture();
  const id = await f.preview();
  const c = f.make({ kind: "button", customId: id });
  await f.service.handle(c);
  await f.service.handle(c);
  assert.equal(f.sent.length, 1);
  assert.equal(f.service.session?.phase, "ready");
  assert.deepEqual(f.sent[0]?.allowedMentions, { parse: [] });
  assert.equal(f.sent[0]?.flags, 4);
});
test("cancel consumes draft without publishing", async () => {
  const f = fixture();
  const id = await f.preview();
  await f.service.handle(f.make({ kind: "button", customId: id.replace(":publish:", ":cancel:") }));
  assert.equal(f.service.drafts.size, 0);
  assert.equal(f.sent.length, 0);
});
test("invalid submitted agenda never creates a publishable preview", async () => {
  const f = fixture();
  await f.service.handle(f.make());
  await f.service.handle(f.make({ kind: "form", customId: f.modal, segments: "nonsense" }));
  assert.equal(f.service.drafts.size, 0);
  assert.match(f.replies.at(-1)?.content ?? "", /Invalid agenda/u);
});
test("failed publication consumes draft and withholds secret error details", async () => {
  const f = fixture();
  f.failPublish();
  const id = await f.preview();
  await f.service.handle(f.make({ kind: "button", customId: id }));
  assert.equal(f.service.session, undefined);
  assert.equal(f.service.drafts.size, 0);
  assert.doesNotMatch(f.replies.at(-1)?.content ?? "", /private secret/u);
});
test("manager control checks permissions and public message binding", async () => {
  const f = fixture();
  await f.publish();
  for (const patch of [{ manage: false }, { message: "forged" }, { channel: "other" }])
    await f.click("start", patch);
  assert.equal(f.service.session?.phase, "ready");
  assert.equal(f.edits.length, 0);
});
test("members can privately inspect but cannot change the agenda", async () => {
  const f = fixture();
  await f.publish();
  await f.click("status", { manage: false, user: "member" });
  assert.match(f.replies.at(-1)?.content ?? "", /Ready/u);
  assert.equal(f.edits.length, 0);
});
test("start, pause, resume and natural deadline produce one transition edit", async () => {
  const f = fixture();
  await f.publish();
  await f.click("start");
  f.time(11_000);
  await f.click("pause");
  assert.equal(f.service.session?.remaining, 50_000);
  f.time(21_000);
  await f.click("resume");
  assert.equal(f.service.session?.due, 71_000);
  f.time(71_000);
  await f.service.tick();
  await f.service.tick();
  assert.equal(f.service.session?.phase, "waiting");
  assert.equal(f.edits.length, 4);
});
test("Next rejects active segment and works at its deadline", async () => {
  const f = fixture();
  await f.publish();
  await f.click("start");
  f.time(11_000);
  await f.click("next");
  assert.equal(f.service.session?.index, 0);
  f.time(61_000);
  await f.click("next");
  assert.equal(f.service.session?.index, 1);
  assert.equal(f.service.session?.due, 181_000);
});
test("a failed edit does not commit a new state", async () => {
  const f = fixture();
  await f.publish();
  f.failEdit();
  await f.click("start");
  assert.equal(f.service.session?.phase, "ready");
});
test("rapid manager writes are throttled", async () => {
  const f = fixture();
  await f.publish();
  await f.click("start");
  await f.click("pause");
  assert.equal(f.service.session?.phase, "running");
  assert.match(f.replies.at(-1)?.content ?? "", /2 seconds/u);
});
test("End requires private confirmation and permission recheck", async () => {
  const f = fixture();
  await f.publish();
  await f.click("end");
  assert.equal(f.service.session?.phase, "ready");
  const id = f.replies.at(-1)?.components[0]?.components[0]?.data.custom_id;
  assert.ok(id);
  await f.service.handle(f.make({ kind: "button", customId: id, manage: false }));
  assert.ok(f.service.session);
  await f.service.handle(f.make({ kind: "button", customId: id }));
  assert.equal(f.service.session, undefined);
  assert.equal(f.edits.length, 1);
});
test("end confirmation belongs to owner and expires", async () => {
  const f = fixture();
  await f.publish();
  await f.click("end");
  const id = f.replies.at(-1)?.components[0]?.components[0]?.data.custom_id;
  assert.ok(id);
  await f.service.handle(f.make({ kind: "button", customId: id, user: "other" }));
  assert.ok(f.service.session);
  f.time(61_000);
  await f.service.handle(f.make({ kind: "button", customId: id }));
  assert.ok(f.service.session);
});
test("TTL cleans an idle meeting and old controls fail safely", async () => {
  const f = fixture();
  await f.publish();
  const id = f.service.session?.id;
  f.time(1000 + TTL);
  await f.service.tick();
  assert.equal(f.service.session, undefined);
  await f.service.handle(f.make({ kind: "button", customId: `hp:start:${id}` }));
  assert.match(f.replies.at(-1)?.content ?? "", /expired/u);
});
test("three bounded timer edit failures retire the stale meeting", async () => {
  const f = fixture();
  await f.publish();
  await f.click("start");
  f.failEdit();
  f.time(61_000);
  await f.service.tick();
  f.time(62_000);
  await f.service.tick();
  assert.ok(f.service.session);
  f.time(91_000);
  await f.service.tick();
  assert.ok(f.service.session);
  f.time(121_000);
  await f.service.tick();
  assert.equal(f.service.session, undefined);
});
test("a restart does not revive old cards", async () => {
  const f = fixture();
  await f.click("start");
  assert.match(f.replies.at(-1)?.content ?? "", /restarted/u);
  assert.equal(f.edits.length, 0);
});
test("one panel per server even with another prepared draft", async () => {
  const f = fixture();
  const first = await f.preview();
  await f.service.handle(f.make({ user: "second" }));
  const second = f.modal;
  await f.service.handle(f.make({ kind: "form", user: "second", customId: second }));
  await f.service.handle(f.make({ kind: "button", customId: first }));
  await f.service.handle(
    f.make({ kind: "button", user: "second", customId: second.replace(":form:", ":publish:") }),
  );
  assert.equal(f.sent.length, 1);
});
test("parallel publication is acknowledged and cannot duplicate a message", async () => {
  const f = fixture();
  const id = await f.preview();
  let release: () => void = () => {};
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  const first = f.service.handle(
    f.make({
      kind: "button",
      customId: id,
      publish: async (body) => {
        await wait;
        f.sent.push(body);
        return { id: "message", edit: async () => {} };
      },
    }),
  );
  await new Promise((resolve) => setImmediate(resolve));
  await f.service.handle(f.make({ kind: "button", customId: id }));
  release();
  await first;
  assert.equal(f.sent.length, 1);
  assert.match(f.replies.map((r) => r.content).join("\n"), /operation is in progress/u);
  assert.equal(f.deferred, 3);
});
test("repeated forms replace owner's previous draft", async () => {
  const f = fixture();
  for (let i = 0; i < 110; i++) await f.service.handle(f.make());
  assert.equal(f.service.drafts.size, 1);
});
test("draft memory capacity is bounded and cleanup releases expired entries", async () => {
  const f = fixture();
  for (let i = 0; i < 101; i++) await f.service.handle(f.make({ user: `user-${i}` }));
  assert.equal(f.service.drafts.size, 100);
  f.time(DRAFT_TTL + 1000);
  await f.service.tick();
  assert.equal(f.service.drafts.size, 0);
});
