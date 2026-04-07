import "dotenv/config";
import { askClaude } from "./claude.js";
import { askDeepSeek } from "./deepseek.js";
import { ensureOutputDir, saveFile, scaffoldDefaults, fileExists } from "./executor.js";

const TASK = `
Build a production-grade salon booking backend for a UAE salon using Node.js, Express, and MongoDB.

Business requirements (owner POV):
- Multi-branch support (each branch has name, address, working hours, holidays, Friday/Saturday weekend)
- Staff management: name, role (stylist/receptionist/manager), specialties, commission rate %, branch assignment, working schedule
- Service catalog: name in English and Arabic, category, duration in minutes, price in AED, VAT-inclusive flag
- Service categories (Hair, Nails, Skin, Makeup, Waxing, etc.)
- Full appointment management: create, reschedule, cancel, no-show tracking
- UAE VAT (5%) calculated and stored on every invoice
- Revenue analytics API: daily/weekly/monthly totals, top services, top stylists by revenue
- Customer CRM: full history, visit count, total spent, preferred stylist, notes
- Loyalty points: earn 1 point per AED 10 spent, redeem 100 points = AED 10 off
- Package deals: e.g. "5 hair sessions for price of 4", track remaining sessions per customer
- Promotional offers: percentage or fixed AED discount, valid date range, applicable services
- Staff commission report: total revenue generated per stylist, commission owed
- Cancellation policy: free if >24h before, 50% charge if <24h, 100% if no-show
- WhatsApp notification support via Twilio: booking confirmation, reminder 2h before, cancellation

Customer POV features:
- Browse services with price (AED), duration, category
- Real-time availability check for a service + stylist + date
- Book appointment: choose service, preferred stylist (or "any available"), date, time slot
- Guest booking (no account required, just phone number)
- Registered customer: booking history, loyalty points balance, saved preferences
- Reschedule or cancel booking (enforce cancellation policy)
- Post-service review and star rating (1-5) with comment
- Waitlist: join waitlist if slot is full, auto-notify when slot opens
- Support bilingual fields (name_en, name_ar) on services and categories

Tech requirements:
- JWT authentication for staff (admin/manager/receptionist roles)
- Input validation with express-validator
- Mongoose schemas with proper indexes
- Centralized error handling middleware
- Pagination on all list endpoints
- Stripe payment intent creation for online payments
- Soft delete on customers, staff, services
- ES modules throughout (import/export)
`;

const TASK_NAME = "UAE Salon Booking Backend";

async function main() {
  await ensureOutputDir();

  console.log("=== UAE Salon Booking System — AI Dev ===\n");
  console.log(`Task: ${TASK_NAME}\n`);

  // ── Step 1: Claude plans ONLY ────────────────────────────────────────────────
  console.log("🧠 Planning with Claude...\n");

  let steps;
  try {
    steps = await askClaude(TASK);
  } catch (err) {
    console.error(`❌ Planning failed: ${err.message}`);
    process.exit(1);
  }

  console.log(`✅ Claude returned ${steps.length} step(s):\n`);

  // ── Step 2: Route each step ──────────────────────────────────────────────────
  for (let i = 0; i < steps.length; i++) {
    const { step, type, file } = steps[i];
    const label = `[Step ${i + 1}/${steps.length}]`;

    // TEXT → print to console only, never send to any AI
    if (type === "TEXT") {
      console.log(`${label} 📋 ${step}\n`);
      continue;
    }

    // CODE → DeepSeek ONLY
    if (type === "CODE") {
      const filename = file || `step-${i + 1}.js`;

      // Skip if already generated (allows resuming interrupted runs)
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
      continue;
    }

    console.warn(`${label} ⚠️  Unknown step type "${type}" — skipping.\n`);
  }

  // ── Step 3: Scaffold any missing default files ───────────────────────────────
  console.log("🔧 Scaffolding defaults...\n");
  await scaffoldDefaults(TASK_NAME);

  // ── Done ─────────────────────────────────────────────────────────────────────
  console.log("\n✅ Project ready");
  console.log("📁 Output: ./output/");
  console.log("▶  Run:    cd output && npm install && node server.js\n");
  console.log("=== Done ===");
}

main();
