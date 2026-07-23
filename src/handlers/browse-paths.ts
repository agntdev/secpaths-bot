import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
  paginate,
} from "../toolkit/index.js";
import { learningPaths, pathIndex, getPathById, getUserProfile, type LearningPath } from "../data.js";

const composer = new Composer<Ctx>();

function formatPathList(page: number): { text: string; keyboard: ReturnType<typeof inlineKeyboard> } {
  const items = pathIndex.map((id) => learningPaths.get(id)!);
  const { pageItems, totalPages, page: actualPage, controls } = paginate(items, {
    page,
    perPage: 3,
    callbackPrefix: "bp:page",
  });

  const lines = ["📚 Available learning paths:"];
  for (const p of pageItems) {
    const access = p.accessLevel === "pro" ? " (Pro)" : "";
    lines.push(`\n▸ ${p.title}${access}\n  ${p.description}`);
  }

  const rows = pageItems.map((p) => [
    inlineButton(`${p.title}`, `bp:sel:${p.id}`),
  ]);

  const keyboard = inlineKeyboard([...rows, ...controls.inline_keyboard]);
  return { text: lines.join("\n"), keyboard };
}

composer.callbackQuery("browse:paths", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (pathIndex.length === 0) {
    await ctx.editMessageText("No learning paths available yet. Check back soon.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }
  const { text, keyboard } = formatPathList(0);
  await ctx.editMessageText(text, { reply_markup: keyboard });
});

composer.callbackQuery(/^bp:page:(prev|next):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const page = parseInt(ctx.match![2], 10);
  const { text, keyboard } = formatPathList(page);
  await ctx.editMessageText(text, { reply_markup: keyboard });
});

composer.callbackQuery(/^bp:sel:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const pathId = ctx.match![1];
  const path = getPathById(pathId);
  if (!path) {
    await ctx.editMessageText("Path not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back", "browse:paths")]]),
    });
    return;
  }

  const userId = ctx.from?.id;
  const profile = userId ? getUserProfile(userId) : null;
  const isEnrolled = profile?.enrolledPaths.includes(pathId) ?? false;
  const accessLabel = path.accessLevel === "pro" ? "Pro" : "Free";

  const text =
    `📖 ${path.title}\n` +
    `${path.description}\n\n` +
    `Access: ${accessLabel} · ${path.modules.length} modules`;

  const buttons = [];
  if (isEnrolled) {
    buttons.push([inlineButton("✅ Enrolled", "browse:paths")]);
  } else {
    buttons.push([inlineButton("📝 Enroll in this path", `enroll:go:${pathId}`)]);
  }
  buttons.push([inlineButton("⬅️ Back to paths", "browse:paths")]);

  await ctx.editMessageText(text, { reply_markup: inlineKeyboard(buttons) });
});

export default composer;
