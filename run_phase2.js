/**
 * Phase 2 runner — reads salon_phase2_plan.json and sends CODE steps to DeepSeek.
 * Run: node run_phase2.js
 */
import "dotenv/config";
import { readFile } from "fs/promises";
import { askDeepSeek } from "./deepseek.js";
import { ensureOutputDir, saveFile, scaffoldDefaults, fileExists } from "./executor.js";

const PLAN_FILE = "./salon_phase2_plan.json";
const TASK_NAME = "UAE Salon Booking Backend — Phase 2";

async function main() {
  await ensureOutputDir();

  console.log("=== UAE Salon Phase 2 — Cron + Tenant + POS + i18n + Frontend ===\n");

  const raw  = await readFile(PLAN_FILE, "utf8");
  const steps = JSON.parse(raw);

  console.log(`📋 Loaded ${steps.length} steps from ${PLAN_FILE}\n`);

  for (let i = 0; i < steps.length; i++) {
    const { step, type, file } = steps[i];
    const label = `[Step ${i + 1}/${steps.length}]`;

    if (type === "TEXT") {
      console.log(`${label} 📋 ${step}\n`);
      continue;
    }

    if (type === "CODE") {
      const filename = file || `step-${i + 1}.js`;

      if (await fileExists(filename)) {
        console.log(`${label} ⏭  Skipping (already exists): ${filename}\n`);
        continue;
      }

      console.log(`${label} 💻 Generating with DeepSeek: ${filename}`);

      let code;
      try {
        code = await askDeepSeek(step, filename);
      } catch (err) {
        console.error(`  ❌ DeepSeek error: ${err.message}\n`);
        continue;
      }

      let outputPath;
      try {
        outputPath = await saveFile(code, filename);
      } catch (err) {
        console.error(`  ❌ File write error: ${err.message}\n`);
        continue;
      }

      console.log(`  📄 Saving file: ${outputPath}\n`);
    }
  }

  await scaffoldDefaults(TASK_NAME);

  console.log("\n✅ Phase 2 complete");
  console.log("📁 Output: ./output/");
  console.log("▶  Backend: node server.js");
  console.log("▶  Frontend: cd output/frontend && npm install && npm run dev\n");
  console.log("=== Done ===");
}

main();
