import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import {
  getUserProfile,
  getResources,
  learningPaths,
  pathIndex,
} from "../data.js";

const composer = new Composer<Ctx>();

// Weekly digest notification
composer.callbackQuery("notif:digest", async (ctx) => {
  await ctx.answerCallbackQuery();
  const resources = getResources();
  if (resources.length === 0) {
    await ctx.editMessageText("No new resources this week.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const lines: string[] = ["📬 Weekly digest — new resources:"];
  for (const r of resources.slice(0, 5)) {
    lines.push("");
    lines.push(`▸ ${r.title}\n  Tags: ${r.tags.join(", ")}`);
  }

  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

// Security alert notification
composer.callbackQuery("notif:alert", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    "🚨 Security bulletin\n\n" +
      "No urgent alerts at this time. Stay patched and monitor your logs.",
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    },
  );
});

// Path reminder notification
composer.callbackQuery("notif:reminder", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const profile = getUserProfile(userId);
  if (profile.enrolledPaths.length === 0) {
    await ctx.editMessageText("You aren't enrolled in any paths yet.", {
      reply_markup: inlineKeyboard([
        [inlineButton("📚 Browse paths", "browse:paths")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }

  const lines = ["🔔 Path reminders:\n"];
  for (const pathId of profile.enrolledPaths) {
    const path = learningPaths.get(pathId);
    if (path) {
      lines.push(`▸ ${path.title} — keep going!`);
    }
  }

  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
