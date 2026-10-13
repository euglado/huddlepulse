import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
export const command = new SlashCommandBuilder()
  .setName("huddle")
  .setDescription("Preview a meeting agenda with a pauseable segment timer")
  .setDescriptionLocalizations({
    tr: "Duraklatılabilir bölüm zamanlayıcısıyla toplantı gündemini önizle",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((o) =>
    o
      .setName("language")
      .setDescription("Language of the public agenda card")
      .setDescriptionLocalizations({ tr: "Herkese açık gündem kartının dili" })
      .addChoices({ name: "Türkçe", value: "tr" }, { name: "English", value: "en" }),
  )
  .toJSON();
