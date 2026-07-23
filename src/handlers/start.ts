import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  mainMenuKeyboard,
  registerMainMenuItem,
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import { getUserProfile } from "../data.js";

// Register feature buttons in the /start main menu.
registerMainMenuItem({ label: "📚 Browse paths", data: "browse:paths", order: 10 });
registerMainMenuItem({ label: "📝 Enroll", data: "enroll:start", order: 20 });
registerMainMenuItem({ label: "🔬 Start lab", data: "lab:start", order: 30 });
registerMainMenuItem({ label: "📊 View progress", data: "progress:view", order: 40 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:open", order: 50 });

const WELCOME = "👋 Welcome! Tap a button below to get started.";

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

// Onboarding: choose focus area
composer.callbackQuery("onboard:focus", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "What's your primary focus area?",
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⚔️ Offense", "onboard:set:offense"), inlineButton("🛡️ Defense", "onboard:set:defense")],
        [inlineButton("🔬 Research", "onboard:set:research"), inlineButton("🔀 Mixed", "onboard:set:mixed")],
      ]),
    },
  );
});

composer.callbackQuery(/^onboard:set:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const focus = ctx.match![1];
  const userId = ctx.from?.id;
  if (userId) {
    const profile = getUserProfile(userId);
    profile.focusArea = focus;
  }
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

// "Back to menu" — re-render the main menu in place from any sub-view.
composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
