import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import {
  learningPaths,
  pathIndex,
  modules,
  moduleIndex,
  labs,
  labIndex,
  resources,
  resourceIndex,
  userProfiles,
  type LearningPath,
  type Module,
  type Lab,
  type Resource,
} from "../data.js";

const ADMIN_CODE = "admin123";

const composer = new Composer<Ctx>();

composer.command("admin", async (ctx) => {
  const session = ctx.session;
  if (session.adminAuthenticated) {
    await showAdminDashboard(ctx);
    return;
  }
  await ctx.reply("🔑 Enter admin code:", {
    reply_markup: { force_reply: true, input_field_placeholder: "Admin code…" },
  });
  session.step = "admin:awaiting_code";
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "admin:awaiting_code") return next();
  const code = ctx.message.text.trim();
  if (code === ADMIN_CODE) {
    ctx.session.adminAuthenticated = true;
    ctx.session.step = undefined;
    await showAdminDashboard(ctx);
  } else {
    await ctx.reply("Invalid code. Access denied.");
    ctx.session.step = undefined;
  }
});

async function showAdminDashboard(ctx: { reply: (text: string, opts?: Record<string, unknown>) => Promise<unknown> }) {
  await ctx.reply(
    "🔧 Admin tools\n\n" +
      `Paths: ${pathIndex.length} · Modules: ${moduleIndex.length} · Labs: ${labIndex.length}\n` +
      `Resources: ${resourceIndex.length} · Users: ${userProfiles.size}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("📄 Publish path", "admin:pubpath"), inlineButton("📢 Announcement", "admin:announce")],
        [inlineButton("👁️ Moderate", "admin:moderate"), inlineButton("🔒 Manage subs", "admin:subs")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    },
  );
}

// Publish a new path
composer.callbackQuery("admin:pubpath", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "Send the new path details in this format:\n\nTitle | Description | focus_area | free|pro",
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", "admin:back")]]),
    },
  );
  ctx.session.step = "admin:awaiting_path";
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "admin:awaiting_path") return next();
  const parts = ctx.message.text.split("|").map((s) => s.trim());
  if (parts.length < 4) {
    await ctx.reply("Format: Title | Description | focus_area | free|pro");
    return;
  }
  const [title, description, focusArea, accessLevel] = parts;
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
  const path: LearningPath = {
    id,
    title: title!,
    description: description!,
    modules: [],
    focusArea: focusArea!,
    accessLevel: accessLevel === "pro" ? "pro" : "free",
  };
  learningPaths.set(id, path);
  pathIndex.push(id);
  ctx.session.step = undefined;
  await ctx.reply(`✅ Published "${title}". Path ID: ${id}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to admin", "admin:back")]]),
  });
});

// Announcements
composer.callbackQuery("admin:announce", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Send the announcement text:", {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Cancel", "admin:back")]]),
  });
  ctx.session.step = "admin:awaiting_announce";
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "admin:awaiting_announce") return next();
  const text = ctx.message.text.trim();
  ctx.session.step = undefined;
  const count = userProfiles.size;
  await ctx.reply(`📢 Announcement sent to ${count} user(s):\n\n${text}`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to admin", "admin:back")]]),
  });
});

// Moderate
composer.callbackQuery("admin:moderate", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    "No pending submissions to review.\n\nUser-submitted content will appear here for approval.",
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to admin", "admin:back")]]),
    },
  );
});

// Manage subscriptions
composer.callbackQuery("admin:subs", async (ctx) => {
  await ctx.answerCallbackQuery();
  const freeCount = [...userProfiles.values()].filter((p) => p.subscriptionStatus === "free").length;
  const proCount = [...userProfiles.values()].filter((p) => p.subscriptionStatus === "pro").length;
  await ctx.reply(
    `Subscriptions:\n▸ Free: ${freeCount}\n▸ Pro: ${proCount}`,
    {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to admin", "admin:back")]]),
    },
  );
});

// Back to admin dashboard
composer.callbackQuery("admin:back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showAdminDashboard(ctx);
});

export default composer;
