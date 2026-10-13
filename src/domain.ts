export type Language = "tr" | "en";
export type Phase = "ready" | "running" | "paused" | "waiting" | "ended";
export type Action = "start" | "pause" | "resume" | "next" | "end";
export type Segment = { title: string; minutes: number };
export type Agenda = { title: string; segments: Segment[]; lang: Language };
export type Session = Agenda & {
  id: string;
  guild: string;
  channel: string;
  message: string;
  createdAt: number;
  index: number;
  phase: Phase;
  due: number;
  remaining: number;
};
export const TTL = 8 * 60 * 60 * 1000;
export const DRAFT_TTL = 10 * 60 * 1000;
export const say = (lang: Language, tr: string, en: string) => (lang === "tr" ? tr : en);
export function plain(value: string, max: number): string {
  const clean = value.trim();
  if (!clean || clean.length > max || /[\p{Cc}\p{Cf}]/u.test(clean)) throw new Error("text");
  // Keep agenda labels readable without active links, mentions or Markdown formatting.
  if (/[<>@`*_~|\\[\]#]/u.test(clean) || /(?:https?:|www\.)/iu.test(clean)) throw new Error("text");
  return clean;
}
export function parseAgenda(title: string, input: string, lang: Language): Agenda {
  const lines = input.trim().split(/\r?\n/);
  if (lines.length < 2 || lines.length > 5) throw new Error("count");
  const segments = lines.map((line) => {
    const match = /^(\d{1,2})\s*\|\s*(.+)$/u.exec(line.trim());
    if (!match) throw new Error("format");
    const minutes = Number(match[1]);
    if (minutes < 1 || minutes > 60) throw new Error("minutes");
    return { minutes, title: plain(match[2] ?? "", 60) };
  });
  if (segments.reduce((n, s) => n + s.minutes, 0) > 180) throw new Error("total");
  return { title: plain(title, 80), segments, lang };
}
export function advance(session: Session, action: Action, now: number): Session {
  if (now >= session.createdAt + TTL || session.phase === "ended") throw new Error("expired");
  const next = { ...session };
  if (next.phase === "running" && now >= next.due) next.phase = "waiting";
  switch (action) {
    case "start":
      if (next.phase !== "ready") throw new Error("state");
      next.phase = "running";
      next.due = now + (next.segments[0]?.minutes ?? 0) * 60_000;
      break;
    case "pause":
      if (next.phase !== "running") throw new Error("state");
      next.remaining = next.due - now;
      next.phase = "paused";
      break;
    case "resume":
      if (next.phase !== "paused") throw new Error("state");
      next.phase = "running";
      next.due = now + next.remaining;
      break;
    case "next":
      // Never silently discard a running or paused segment.
      if (next.phase !== "waiting") throw new Error("state");
      next.index++;
      if (next.index >= next.segments.length) next.phase = "ended";
      else {
        next.phase = "running";
        next.due = now + (next.segments[next.index]?.minutes ?? 0) * 60_000;
      }
      break;
    case "end":
      next.phase = "ended";
      break;
  }
  return next;
}
export function phaseText(s: Session, now: number): string {
  const lang = s.lang;
  if (now >= s.createdAt + TTL) return say(lang, "Oturum süresi doldu", "Session expired");
  if (s.phase === "running" && now >= s.due)
    return say(
      lang,
      "Bölüm bitti; Sonraki düğmesini bekliyor",
      "Segment finished; waiting for Next",
    );
  switch (s.phase) {
    case "ready":
      return say(lang, "Başlatılmaya hazır", "Ready to start");
    case "running":
      return say(
        lang,
        `Bölüm bitişi: <t:${Math.ceil(s.due / 1000)}:R>`,
        `Segment ends <t:${Math.ceil(s.due / 1000)}:R>`,
      );
    case "paused":
      return say(
        lang,
        `Duraklatıldı (${Math.ceil(s.remaining / 1000)} sn kaldı)`,
        `Paused (${Math.ceil(s.remaining / 1000)} seconds left)`,
      );
    case "waiting":
      return say(
        lang,
        "Bölüm bitti; Sonraki düğmesini bekliyor",
        "Segment finished; waiting for Next",
      );
    case "ended":
      return say(lang, "Toplantı gündemi sona erdi", "Meeting agenda ended");
  }
}
