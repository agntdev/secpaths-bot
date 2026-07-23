import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import {
  getUserProfile,
  getUserProgress,
  getPathById,
  getModulesForPath,
} from "../data.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("progress:view", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.editMessageText("Couldn't load your progress. Try again.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const profile = getUserProfile(userId);
  const progress = getUserProgress(userId);

  if (profile.enrolledPaths.length === 0) {
    await ctx.editMessageText(
      "📊 No progress yet — you aren't enrolled in any paths.\n\nTap 📚 Browse paths to get started.",
      {
        reply_markup: inlineKeyboard([
          [inlineButton("📚 Browse paths", "browse:paths")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  const lines = ["📊 Your progress:\n"];
  for (const pathId of profile.enrolledPaths) {
    const path = getPathById(pathId);
    if (!path) continue;
    const mods = getModulesForPath(pathId);
    const completed = mods.filter((m) => progress.completedModules.includes(m.id)).length;
    const total = mods.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    lines.push(`▸ ${path.title}: ${completed}/${total} modules (${pct}%)`);
  }

  const labCount = progress.completedLabs.length;
  if (labCount > 0) {
    lines.push(`\n🔬 Labs completed: ${labCount}`);
  }

  if (progress.certificates.length > 0) {
    lines.push("\n🎓 Certificates:");
    for (const certId of progress.certificates) {
      const path = getPathById(certId);
      lines.push(`▸ ${path?.title ?? certId}`);
    }
  }

  const hasNotes = Object.keys(progress.notes).length > 0;
  if (hasNotes) {
    lines.push(`\n📝 Notes saved: ${Object.keys(progress.notes).length}`);
  }

  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
