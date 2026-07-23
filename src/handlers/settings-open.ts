import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import { getUserProfile } from "../data.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("settings:open", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.editMessageText("Couldn't load settings. Try again.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const profile = getUserProfile(userId);
  const focus = profile.focusArea ?? "Not set";
  const cadence = profile.deliveryCadence ?? "Weekly";
  const sub = profile.subscriptionStatus === "pro" ? "Pro" : "Free";
  const email = profile.emailOptIn ? "On" : "Off";
  const notif = profile.notificationsEnabled ? "On" : "Off";

  const text =
    "⚙️ Your settings\n\n" +
    `Focus area: ${focus}\n` +
    `Delivery cadence: ${cadence}\n` +
    `Subscription: ${sub}\n` +
    `Email summaries: ${email}\n` +
    `Notifications: ${notif}`;

  await ctx.editMessageText(text, {
    reply_markup: inlineKeyboard([
      [inlineButton("🎯 Change focus", "settings:focus")],
      [inlineButton("📬 Email summaries", "settings:email")],
      [inlineButton("🔔 Notifications", "settings:notif")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery("settings:focus", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Choose your primary focus area:", {
    reply_markup: inlineKeyboard([
      [inlineButton("⚔️ Offense", "settings:focus:offense"), inlineButton("🛡️ Defense", "settings:focus:defense")],
      [inlineButton("🔬 Research", "settings:focus:research"), inlineButton("🔀 Mixed", "settings:focus:mixed")],
      [inlineButton("⬅️ Back", "settings:open")],
    ]),
  });
});

composer.callbackQuery(/^settings:focus:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const focus = ctx.match![1];
  const userId = ctx.from?.id;
  if (userId) {
    const profile = getUserProfile(userId);
    profile.focusArea = focus;
  }
  await ctx.editMessageText(`Focus area updated to: ${focus}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

composer.callbackQuery("settings:email", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  const profile = userId ? getUserProfile(userId) : null;
  const current = profile?.emailOptIn ?? false;

  await ctx.editMessageText(
    `Email summaries are currently ${current ? "on" : "off"}.\n\n` +
      "Receive a weekly digest of new resources and progress updates via email.",
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton(current ? "✅ Currently on" : "Turn on", "settings:email:on"),
          inlineButton(!current ? "✅ Currently off" : "Turn off", "settings:email:off"),
        ],
        [inlineButton("⬅️ Back", "settings:open")],
      ]),
    },
  );
});

composer.callbackQuery(/^settings:email:(on|off)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const optIn = ctx.match![1] === "on";
  const userId = ctx.from?.id;
  if (userId) {
    const profile = getUserProfile(userId);
    profile.emailOptIn = optIn;
  }
  await ctx.editMessageText(`Email summaries ${optIn ? "enabled" : "disabled"}.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

composer.callbackQuery("settings:notif", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  const profile = userId ? getUserProfile(userId) : null;
  const enabled = profile?.notificationsEnabled ?? true;

  await ctx.editMessageText(
    `Notifications are currently ${enabled ? "on" : "off"}.\n\n` +
      "Get alerts for new modules, security bulletins, and path reminders.",
    {
      reply_markup: inlineKeyboard([
        [
          inlineButton(enabled ? "✅ Currently on" : "Turn on", "settings:notif:on"),
          inlineButton(!enabled ? "✅ Currently off" : "Turn off", "settings:notif:off"),
        ],
        [inlineButton("⬅️ Back", "settings:open")],
      ]),
    },
  );
});

composer.callbackQuery(/^settings:notif:(on|off)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const enabled = ctx.match![1] === "on";
  const userId = ctx.from?.id;
  if (userId) {
    const profile = getUserProfile(userId);
    profile.notificationsEnabled = enabled;
  }
  await ctx.editMessageText(`Notifications ${enabled ? "enabled" : "disabled"}.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

export default composer;
