import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import {
  getLabsForModule,
  getLabById,
  getModuleById,
  getUserProgress,
  getPathById,
  getModulesForPath,
  labIndex,
  labs,
} from "../data.js";

const composer = new Composer<Ctx>();

function getAvailableLabs() {
  return labIndex.map((id) => {
    const l = labs.get(id)!;
    const mod = getModuleById(l.moduleId);
    return { lab: l, moduleName: mod?.title ?? "Unknown" };
  });
}

composer.callbackQuery("lab:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  const progress = userId ? getUserProgress(userId) : null;

  const available = getAvailableLabs();
  if (available.length === 0) {
    await ctx.editMessageText("No labs available yet. Check back soon.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const completedCount = progress?.completedLabs.length ?? 0;
  const lines = [`🔬 Labs — ${completedCount} completed`];

  const buttons = available.map(({ lab, moduleName }) => {
    const done = progress?.completedLabs.includes(lab.id) ? " ✓" : "";
    return [inlineButton(`${lab.title}${done}`, `lab:show:${lab.id}`)];
  });

  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard([...buttons, [inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

composer.callbackQuery(/^lab:frommod:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const moduleId = ctx.match![1];
  const module = getModuleById(moduleId);
  if (!module) {
    await ctx.editMessageText("Module not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const labsForMod = getLabsForModule(moduleId);
  if (labsForMod.length === 0) {
    await ctx.editMessageText(
      `📖 ${module.title}\n${module.content}\n\nNo labs for this module yet.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("📊 View progress", "progress:view")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
    return;
  }

  await ctx.editMessageText(
    `📖 ${module.title}\n${module.content}\n\nPick a lab to start:`,
    {
      reply_markup: inlineKeyboard([
        ...labsForMod.map((l) => [inlineButton(l.title, `lab:show:${l.id}`)]),
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
});

composer.callbackQuery(/^lab:show:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const labId = ctx.match![1];
  const lab = getLabById(labId);
  if (!lab) {
    await ctx.editMessageText("Lab not found.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
    return;
  }

  const userId = ctx.from?.id;
  const progress = userId ? getUserProgress(userId) : null;
  const isComplete = progress?.completedLabs.includes(labId) ?? false;

  const lines = [
    `🔬 ${lab.title}`,
    "",
    "Instructions:",
    lab.instructions,
    "",
    "Expected outcomes:",
    ...lab.expectedOutcomes.map((o) => `▸ ${o}`),
  ];

  if (isComplete) {
    lines.push("", "✅ Completed");
  }

  const buttons = [];
  if (!isComplete) {
    buttons.push([inlineButton("✅ Submit evidence", `lab:submit:${labId}`)]);
  }
  buttons.push([inlineButton("⬅️ Back to labs", "lab:start")]);

  await ctx.editMessageText(lines.join("\n"), {
    reply_markup: inlineKeyboard(buttons),
  });
});

composer.callbackQuery(/^lab:submit:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const labId = ctx.match![1];
  const lab = getLabById(labId);
  if (!lab) return;

  await ctx.editMessageText(
    "Send your evidence (text describing what you did and found).",
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", `lab:show:${labId}`)]]),
    },
  );

  const userId = ctx.from?.id;
  if (userId) {
    const progress = getUserProgress(userId);
    progress.completedLabs.push(labId);

    const mod = getModuleById(lab.moduleId);
    if (mod && !progress.completedModules.includes(mod.id)) {
      progress.completedModules.push(mod.id);

      const path = getPathById(mod.pathId);
      if (path) {
        const allModules = getModulesForPath(mod.pathId);
        const allComplete = allModules.every((m) => progress.completedModules.includes(m.id));
        if (allComplete && !progress.certificates.includes(mod.pathId)) {
          progress.certificates.push(mod.pathId);
        }
      }
    }
  }
});

export default composer;
