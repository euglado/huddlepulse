import assert from "node:assert/strict";
import { test } from "node:test";
import { advance, parseAgenda, phaseText, plain, type Session, TTL } from "../src/domain.ts";

const agenda = () => parseAgenda("Community meeting", "1 | Welcome\n2 | Discussion", "en");
const session = (): Session => ({
  ...agenda(),
  id: "id",
  guild: "guild",
  channel: "channel",
  message: "message",
  createdAt: 0,
  index: 0,
  phase: "ready",
  due: 0,
  remaining: 0,
});
test("parses CRLF, whitespace and Turkish plain labels", () => {
  const a = parseAgenda("  Topluluk  ", "5 | Açılış\r\n15 | Görüşler", "tr");
  assert.equal(a.title, "Topluluk");
  assert.equal(a.segments[1]?.minutes, 15);
});
for (const [name, value] of Object.entries({
  one: "1 | A",
  six: "1 | A\n1 | B\n1 | C\n1 | D\n1 | E\n1 | F",
  zero: "0 | A\n2 | B",
  over: "61 | A\n2 | B",
  fraction: "1.5 | A\n2 | B",
  total: "60 | A\n60 | B\n60 | C\n1 | D",
  missing: "Welcome\n2 | B",
  empty: "1 | \n2 | B",
})) {
  test(`rejects invalid agenda: ${name}`, () =>
    assert.throws(() => parseAgenda("Title", value, "en")));
}
for (const value of [
  "",
  "@everyone",
  "<@123>",
  "https://example.org",
  "www.example.org",
  "**bold**",
  "[label](url)",
  "invisible\u200btext",
  "a\u0000b",
  "a".repeat(81),
]) {
  test(`rejects unsafe title ${JSON.stringify(value.slice(0, 22))}`, () =>
    assert.throws(() => plain(value, 80)));
}
test("start preserves original and sets a deadline", () => {
  const s = session();
  const n = advance(s, "start", 1000);
  assert.equal(s.phase, "ready");
  assert.equal(n.phase, "running");
  assert.equal(n.due, 61_000);
});
test("pause and resume preserve remaining time", () => {
  const s = advance(advance(session(), "start", 0), "pause", 20_000);
  assert.equal(s.remaining, 40_000);
  const n = advance(s, "resume", 100_000);
  assert.equal(n.due, 140_000);
});
test("cannot skip a live or paused segment", () => {
  const s = advance(session(), "start", 0);
  assert.throws(() => advance(s, "next", 30_000));
  assert.throws(() => advance(advance(s, "pause", 20_000), "next", 30_000));
});
test("late Next begins only one next segment from now", () => {
  const s = advance(session(), "start", 0);
  const n = advance(s, "next", 1_000_000);
  assert.equal(n.index, 1);
  assert.equal(n.due, 1_120_000);
});
test("last Next ends the agenda", () => {
  const s = advance(advance(session(), "start", 0), "next", 60_000);
  assert.equal(advance(s, "next", 180_000).phase, "ended");
});
test("cannot pause after deadline or start twice", () => {
  const s = advance(session(), "start", 0);
  assert.throws(() => advance(s, "pause", 60_000));
  assert.throws(() => advance(s, "start", 1));
});
test("TTL ends even an idle or paused agenda", () => {
  assert.throws(() => advance(session(), "start", TTL));
  assert.match(phaseText(session(), TTL), /expired/u);
});
test("end works from ready and ended cannot be revived", () => {
  const s = advance(session(), "end", 1);
  assert.equal(s.phase, "ended");
  assert.throws(() => advance(s, "start", 2));
});
test("status reflects elapsed deadline even before timer tick", () => {
  const s = advance(session(), "start", 0);
  assert.match(phaseText(s, 59_000), /<t:60:R>/u);
  assert.match(phaseText(s, 60_000), /finished/u);
});
