import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { type Agenda, type Language, phaseText, type Session, say, TTL } from "./domain.ts";
export function button(id: string, label: string, style = ButtonStyle.Secondary, disabled = false) {
  return new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(style).setDisabled(disabled);
}
export function payload(content: string, buttons: ButtonBuilder[] = []) {
  return {
    content,
    allowedMentions: { parse: [] as never[] },
    flags: MessageFlags.SuppressEmbeds as const,
    components: buttons.length
      ? [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
      : [],
  };
}
export type Panel = ReturnType<typeof payload>;
export function agendaLines(a: Agenda) {
  return a.segments.map((s, i) => `${i + 1}. ${s.title} — ${s.minutes} min`).join("\n");
}
export function form(id: string, lang: Language) {
  return new ModalBuilder()
    .setCustomId(`hp:form:${id}`)
    .setTitle("HuddlePulse")
    .addLabelComponents(
      new LabelBuilder()
        .setLabel(say(lang, "Toplantı başlığı", "Meeting title"))
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("title")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(80)
            .setRequired(true),
        ),
      new LabelBuilder()
        .setLabel(
          say(lang, "Gündem: dakika | bölüm (2–5 satır)", "Agenda: minutes | segment (2–5 lines)"),
        )
        .setDescription(
          say(
            lang,
            "Her bölüm 1–60 dakika; toplam en fazla 180 dakika.",
            "1–60 minutes per segment; at most 180 minutes total.",
          ),
        )
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("segments")
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(400)
            .setRequired(true)
            .setPlaceholder("5 | Welcome\n15 | Discussion\n5 | Wrap-up"),
        ),
    );
}
export function preview(a: Agenda, id: string) {
  return payload(
    `${say(a.lang, "Özel önizleme", "Private preview")} — ${a.title}\n${agendaLines(a)}\n\n${say(a.lang, "Yayımla bu kanala tek bir kart gönderir. Zamanlayıcı Başlat ile başlar. Önizleme 10 dakika geçerlidir.", "Publish sends one card to this channel. The timer begins only with Start. Preview expires in 10 minutes.")}`,
    [
      button(`hp:publish:${id}`, say(a.lang, "Yayımla", "Publish"), ButtonStyle.Primary),
      button(`hp:cancel:${id}`, say(a.lang, "Vazgeç", "Cancel")),
    ],
  );
}
export function panel(s: Session, now: number) {
  const expired = now >= s.createdAt + TTL;
  const finished = s.phase === "ended" || expired;
  const phase = s.phase === "running" && now >= s.due ? "waiting" : s.phase;
  const current = s.segments[Math.min(s.index, s.segments.length - 1)];
  const lang = s.lang;
  const pauseLabel =
    phase === "paused" ? say(lang, "Devam", "Resume") : say(lang, "Duraklat", "Pause");
  const controls = [
    button(
      `hp:start:${s.id}`,
      say(lang, "Başlat", "Start"),
      ButtonStyle.Success,
      phase !== "ready" || finished,
    ),
    button(
      `hp:${phase === "paused" ? "resume" : "pause"}:${s.id}`,
      pauseLabel,
      ButtonStyle.Secondary,
      !["running", "paused"].includes(phase) || finished,
    ),
    button(
      `hp:next:${s.id}`,
      say(lang, "Sonraki", "Next"),
      ButtonStyle.Primary,
      phase !== "waiting" || finished,
    ),
    button(`hp:end:${s.id}`, say(lang, "Bitir", "End"), ButtonStyle.Danger, finished),
    button(`hp:status:${s.id}`, say(lang, "Özel durum", "Private status")),
  ];
  return payload(
    `HuddlePulse — ${s.title}\n${agendaLines(s)}\n\n${say(lang, "Şimdiki bölüm", "Current segment")}: ${current?.title ?? "—"}\n${phaseText(s, now)}\n\n${say(lang, "İlk dört düğme: Sunucuyu Yönet yetkisi. Bölümler kendiliğinden atlanmaz. Ses veya katılımcı takibi yok. Yeniden başlatma oturumu bitirir.", "First four buttons: Manage Server permission. Segments never skip automatically. No voice or attendance tracking. Restart ends the session.")}`,
    controls,
  );
}
