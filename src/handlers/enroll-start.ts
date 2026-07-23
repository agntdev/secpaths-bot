import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
  mainMenuKeyboard,
} from "../toolkit/index.js";
import {
  getUserProfile,
  getPathById,
  getModulesForPath,
  learningPaths,
  pathIndex,
} from "../data.js";

const composer = new Composer<Ctx>();

function getPathChoices() {
  return pathIndex.map((id) => {
    const p = learningPaths.get(id)!;
    return inlineButton(p.title, `enroll:go:${p.id}`);
  });
}

composer.callbackQuery("enroll:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  const profile = userId ? getUserProfile(userId) : null;

  if (profile && profile.enrolledPaths.length > 0) {
    const enrolled = profile.enrolledPaths
      .map((id) => getPathById(id))
      .filter(Boolean)
      .map((p) => `▸ ${p!.title}`)
      .join("\n");
    await ctx.editMessageText(
      `📝 You're enrolled in:\n${enrolled}\n\nPick another path to enroll, or tap a path to continue.`,
      {
        reply_markup: inlineKeyboard([
          ...getPathChoices().map((b) => [b]),
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  await ctx.editMessageText("Choose a learning path to enroll in:", {
    reply_markup: inlineKeyboard([
      ...getPathChoices().map((b) => [b]),
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^enroll:go:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const pathId = ctx.match![1];
  const path = getPathById(pathId);
  const userId = ctx.from?.id;

  if (!path) {
    await ctx.editMessageText("Path not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  if (path.accessLevel === "pro") {
    const profile = userId ? getUserProfile(userId) : null;
    if (profile?.subscriptionStatus !== "pro") {
      await ctx.editMessageText(
        "🔒 This path requires a Pro subscription.\n\nUpgrade in Settings to access premium content.",
        {
          reply_markup: inlineKeyboard([
            [inlineButton("⚙️ Settings", "settings:open")],
            [inlineButton("⬅️ Back to menu", "menu:main")],
          ]),
        },
      );
      return;
    }
  }

  if (userId) {
    const profile = getUserProfile(userId);
    if (!profile.enrolledPaths.includes(pathId)) {
      profile.enrolledPaths.push(pathId);
    }
  }

  const modules = getModulesForPath(pathId);
  const firstMod = modules[0];

  await ctx.editMessageText(
    `✅ Enrolled in ${path.title}!\n\n` +
      (firstMod
        ? `First module: ${firstMod.title}\n${firstMod.content}`
        : "No modules available yet."),
    {
      reply_markup: inlineKeyboard([
        ...(firstMod ? [[inlineButton("🔬 Start lab", `lab:frommod:${firstMod.id}`)]] : []),
        [inlineButton("📊 View progress", "progress:view")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

export default composer;
