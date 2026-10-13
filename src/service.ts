import { randomUUID } from "node:crypto";
import type { ModalBuilder } from "discord.js";
import {
  type Action,
  type Agenda,
  advance,
  DRAFT_TTL,
  type Language,
  parseAgenda,
  phaseText,
  type Session,
  say,
  TTL,
} from "./domain.ts";
import { button, form, type Panel, panel, payload, preview } from "./views.ts";
export type Editor = (body: Panel) => Promise<unknown>;
export type Context = {
  kind: "command" | "form" | "button";
  guild: string;
  channel: string;
  user: string;
  message: string;
  customId: string;
  lang: Language;
  manage: boolean;
  canPublish: boolean;
  title: string;
  segments: string;
  reply: (body: Panel) => Promise<unknown>;
  defer: () => Promise<unknown>;
  editReply: (body: Panel) => Promise<unknown>;
  showModal: (body: ModalBuilder) => Promise<unknown>;
  publish: (body: Panel) => Promise<{ id: string; edit: Editor }>;
};
type Draft = { owner: string; guild: string; channel: string; expires: number; lang: Language } & (
  | { kind: "form" }
  | { kind: "preview"; agenda: Agenda }
  | { kind: "end"; session: string; message: string }
);
export class MeetingService {
  readonly drafts = new Map<string, Draft>();
  session: Session | undefined;
  private editor: Editor | undefined;
  private busy = false;
  private lastPublish = -Infinity;
  private lastAction = -Infinity;
  private failures = 0;
  private lastRetry = -Infinity;
  readonly guild: string;
  private readonly clock: () => number;
  private readonly id: () => string;
  constructor(guild: string, clock = Date.now, id: () => string = randomUUID) {
    this.guild = guild;
    this.clock = clock;
    this.id = id;
  }
  private message(lang: Language, tr: string, en: string) {
    return payload(say(lang, tr, en));
  }
  private prune() {
    for (const [id, d] of this.drafts) if (d.expires <= this.clock()) this.drafts.delete(id);
  }
  private draft(
    c: Context,
    extra:
      | { kind: "form" }
      | { kind: "preview"; agenda: Agenda }
      | { kind: "end"; session: string; message: string },
  ) {
    this.prune();
    // Replace the same owner's previous form/confirmation to bound accidental repeats.
    for (const [id, d] of this.drafts) if (d.owner === c.user) this.drafts.delete(id);
    if (this.drafts.size >= 100) throw new Error("capacity");
    const id = this.id();
    this.drafts.set(id, {
      owner: c.user,
      guild: c.guild,
      channel: c.channel,
      expires: this.clock() + (extra.kind === "end" ? 60_000 : DRAFT_TTL),
      lang: c.lang,
      ...extra,
    });
    return id;
  }
  async handle(c: Context): Promise<void> {
    if (c.guild !== this.guild) {
      await c.reply(
        this.message(
          c.lang,
          "Bu bot yalnızca yapılandırılan sunucuda çalışır.",
          "This bot only works in its configured server.",
        ),
      );
      return;
    }
    if (c.kind === "command") {
      if (!c.manage || !c.canPublish) {
        await c.reply(
          this.message(
            c.lang,
            "Sunucuyu Yönet yetkisi ve bot için Kanalı Görüntüle/Mesaj Gönder izni olan normal metin kanalı gerekir.",
            "Use a regular text channel with Manage Server permission and bot View Channel/Send Messages permissions.",
          ),
        );
        return;
      }
      if (this.session) {
        await c.reply(
          this.message(
            c.lang,
            "Sunucuda zaten bir gündem var. Önce onu bitirin; süresi dolduysa kısa süre bekleyin.",
            "A server agenda already exists. End it first; if expired, wait briefly for cleanup.",
          ),
        );
        return;
      }
      try {
        await c.showModal(form(this.draft(c, { kind: "form" }), c.lang));
      } catch {
        await c.reply(
          this.message(
            c.lang,
            "Form açılamadı. Biraz sonra yeniden deneyin.",
            "Could not open the form. Try again shortly.",
          ),
        );
      }
      return;
    }
    await c.defer(); // Acknowledge before any network work or serialization.
    const finish = (tr: string, en: string) => c.editReply(this.message(c.lang, tr, en));
    if (this.busy) {
      await finish(
        "Bir işlem sürüyor. Biraz sonra yeniden deneyin.",
        "An operation is in progress. Try again shortly.",
      );
      return;
    }
    this.busy = true;
    try {
      this.prune();
      const match = /^hp:([a-z]+):([a-f0-9-]{36})$/u.exec(c.customId);
      if (!match) {
        await finish("Geçersiz düğme.", "Invalid control.");
        return;
      }
      const action = match[1];
      const id = match[2] ?? "";
      const now = this.clock();
      if (["form", "publish", "cancel", "confirm"].includes(action ?? "")) {
        const d = this.drafts.get(id);
        if (!d || d.owner !== c.user || d.guild !== c.guild || d.channel !== c.channel) {
          await finish(
            "Önizleme size ait değil veya süresi doldu. /huddle ile yeniden başlayın.",
            "This preview is not yours or has expired. Start again with /huddle.",
          );
          return;
        }
        if (action === "cancel") {
          this.drafts.delete(id);
          await finish("Vazgeçildi.", "Cancelled.");
          return;
        }
        if (!c.manage) {
          await finish("Sunucuyu Yönet yetkisi gerekir.", "Manage Server permission is required.");
          return;
        }
        if (action === "form" && c.kind === "form" && d.kind === "form") {
          let agenda: Agenda;
          try {
            agenda = parseAgenda(c.title, c.segments, d.lang);
          } catch {
            this.drafts.delete(id);
            await finish(
              "Gündem geçersiz: 2–5 satır, dakika | bölüm. Bölüm 1–60 dk, toplam ≤180 dk. Başlıklar düz metin olmalı; bağlantı/etiket/biçimlendirme kullanmayın. /huddle ile yeniden deneyin.",
              "Invalid agenda: 2–5 lines of minutes | segment. Each 1–60 min, total ≤180 min. Use plain titles without links/mentions/formatting. Retry /huddle.",
            );
            return;
          }
          this.drafts.set(id, { ...d, kind: "preview", agenda });
          await c.editReply(preview(agenda, id));
          return;
        }
        if (action === "publish" && d.kind === "preview") {
          if (!c.canPublish || this.session || now - this.lastPublish < 60_000) {
            await finish(
              "Yayımlanamadı: izinleri, mevcut gündemi ve 60 saniyelik yayımlama aralığını kontrol edin.",
              "Cannot publish: check channel permissions, existing agenda and the 60-second publication cooldown.",
            );
            return;
          }
          this.drafts.delete(id); // Never replay publication after a network ambiguity.
          this.lastPublish = now; // Failed/ambiguous sends also consume the cooldown.
          const s: Session = {
            ...d.agenda,
            id: this.id(),
            guild: c.guild,
            channel: c.channel,
            message: "",
            createdAt: now,
            index: 0,
            phase: "ready",
            due: 0,
            remaining: 0,
          };
          const sent = await c.publish(panel(s, now));
          s.message = sent.id;
          this.session = s;
          this.editor = sent.edit;
          this.lastAction = -Infinity;
          this.failures = 0;
          this.lastRetry = -Infinity;
          await finish(
            "Gündem yayımlandı. Karttaki Başlat düğmesini kullanın.",
            "Agenda published. Use Start on its public card.",
          );
          return;
        }
        if (action === "confirm" && d.kind === "end") {
          if (
            !this.session ||
            this.session.id !== d.session ||
            this.session.message !== d.message ||
            this.session.channel !== c.channel
          ) {
            this.drafts.delete(id);
            await finish("Oturum artık etkin değil.", "Session is no longer active.");
            return;
          }
          this.drafts.delete(id);
          await this.change("end", now);
          await finish("Gündem bitirildi.", "Agenda ended.");
          return;
        }
        await finish("Bu önizleme artık kullanılamaz.", "This preview can no longer be used.");
        return;
      }
      const s = this.session;
      if (
        !s ||
        s.id !== id ||
        s.channel !== c.channel ||
        s.message !== c.message ||
        now >= s.createdAt + TTL
      ) {
        await finish(
          "Bu kartın oturumu sona ermiş, süresi dolmuş veya bot yeniden başlatılmış. Yönetici eski kartı silebilir; /huddle ile yeniden başlayın.",
          "This card's session ended, expired or the bot restarted. A manager can delete the old card; start again with /huddle.",
        );
        return;
      }
      if (action === "status") {
        await c.editReply(payload(`${s.title}\n${phaseText(s, now)}`));
        return;
      }
      if (!c.manage) {
        await finish(
          "Sunucuyu Yönet yetkisi gerekir. Özel durum düğmesi herkese açıktır.",
          "Manage Server permission is required. Private status is available to everyone.",
        );
        return;
      }
      if (now - this.lastAction < 2000) {
        await finish("Kontroller arasında 2 saniye bekleyin.", "Wait 2 seconds between controls.");
        return;
      }
      this.lastAction = now;
      if (action === "end") {
        const key = this.draft(c, { kind: "end", session: s.id, message: s.message });
        await c.editReply(
          payload(
            say(
              c.lang,
              "Gündemi bitirmek istiyor musunuz? Onay 60 saniye geçerlidir.",
              "End this agenda? Confirmation expires in 60 seconds.",
            ),
            [
              button(`hp:confirm:${key}`, say(c.lang, "Bitirmeyi onayla", "Confirm end")),
              button(`hp:cancel:${key}`, say(c.lang, "Vazgeç", "Cancel")),
            ],
          ),
        );
        return;
      }
      if (!["start", "pause", "resume", "next"].includes(action ?? "")) {
        await finish("Geçersiz kontrol.", "Invalid control.");
        return;
      }
      try {
        await this.change(action as Action, now);
      } catch (e) {
        if (e instanceof Error && ["state", "expired"].includes(e.message)) {
          await finish(
            "Bu işlem şu an uygun değil. Sonraki yalnızca bölümün süresi bitince açılır; duraklatılmış bölüm için Devam kullanın.",
            "That action is unavailable now. Next opens only after the segment ends; use Resume for a paused segment.",
          );
          return;
        }
        throw e;
      }
      await finish("Gündem güncellendi.", "Agenda updated.");
    } catch {
      await finish(
        "Discord işlemi tamamlanamadı. Botun kanal izinlerini kontrol edin. Yayımlama belirsizse yeniden denemeden önce kanala bakın; hata ayrıntıları ve tokenlar kaydedilmez.",
        "Discord could not complete the operation. Check bot channel permissions. If publication is uncertain, inspect the channel before retrying; error details and tokens are not logged.",
      );
    } finally {
      this.busy = false;
    }
  }
  private async change(action: Action, now: number) {
    if (!this.session || !this.editor) throw new Error("expired");
    const candidate = advance(this.session, action, now);
    await this.editor(panel(candidate, now));
    this.session = candidate.phase === "ended" ? undefined : candidate;
    if (!this.session) this.editor = undefined;
  }
  async tick(): Promise<void> {
    this.prune();
    const now = this.clock();
    const s = this.session;
    if (this.busy || !s || !this.editor || now - this.lastRetry < 30_000) return;
    const expired = now >= s.createdAt + TTL;
    if (!expired && !(s.phase === "running" && now >= s.due)) return;
    this.busy = true;
    this.lastRetry = now;
    const next: Session = { ...s, phase: expired ? "ended" : "waiting" };
    try {
      await this.editor(panel(next, now));
      this.failures = 0;
      this.session = expired ? undefined : next;
      if (expired) this.editor = undefined;
    } catch {
      this.failures++;
      if (expired || this.failures >= 3) {
        this.session = undefined;
        this.editor = undefined;
      }
    } finally {
      this.busy = false;
    }
  }
}
