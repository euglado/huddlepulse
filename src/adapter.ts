import { ChannelType, type Interaction, MessageFlags, PermissionFlagsBits } from "discord.js";
import type { Context } from "./service.ts";
export function context(i: Interaction): Context | undefined {
  if (
    !(i.isChatInputCommand() && i.commandName === "huddle") &&
    !(i.isButton() && i.customId.startsWith("hp:")) &&
    !(i.isModalSubmit() && i.customId.startsWith("hp:"))
  )
    return undefined;
  if (!i.isChatInputCommand() && !i.isButton() && !i.isModalSubmit()) return undefined;
  const lang = i.isChatInputCommand() ? i.options.getString("language") : null;
  const channel = i.channel;
  return {
    kind: i.isChatInputCommand() ? "command" : i.isModalSubmit() ? "form" : "button",
    guild: i.guildId ?? "",
    channel: i.channelId ?? "",
    user: i.user.id,
    message: i.isButton() ? i.message.id : "",
    customId: i.isChatInputCommand() ? "" : i.customId,
    lang: lang === "tr" || (!lang && i.locale.startsWith("tr")) ? "tr" : "en",
    manage: i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ?? false,
    canPublish:
      channel?.type === ChannelType.GuildText &&
      (i.appPermissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]) ??
        false),
    title: i.isModalSubmit() ? i.fields.getTextInputValue("title") : "",
    segments: i.isModalSubmit() ? i.fields.getTextInputValue("segments") : "",
    reply: (body) =>
      i.reply({ ...body, flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds }),
    defer: () => i.deferReply({ flags: MessageFlags.Ephemeral }),
    editReply: (body) => i.editReply(body),
    showModal: async (body) => {
      if (!i.isModalSubmit()) return i.showModal(body);
      throw new Error("modal");
    },
    publish: async (body) => {
      if (channel?.type !== ChannelType.GuildText) throw new Error("channel");
      const message = await channel.send(body);
      return { id: message.id, edit: (next) => message.edit(next) };
    },
  };
}
