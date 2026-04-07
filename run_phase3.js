import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { askDeepSeek } from './deepseek.js';

async function run() {
  console.log('🚀 Starting Phase 3 - Production Readiness\n');
  
  const plan = JSON.parse(readFileSync('phase3_plan.json', 'utf8'));
  const tasks = plan.tasks;
  
  console.log(`📋 Loaded ${tasks.length} tasks from phase3_plan.json\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const filePath = task.file_path;
    
    // Skip summary task
    if (task.type === 'TEXT' || task.category === 'summary') {
      console.log(`[${i+1}/${tasks.length}] 📝 NOTE: ${task.instructions.substring(0, 100)}...`);
      continue;
    }
    
    console.log(`[${i+1}/${tasks.length}] 💻 Generating: ${filePath}`);
    
    try {
      const code = await askDeepSeek(task.instructions, filePath);
      
      if (filePath && filePath !== 'summary') {
        const dir = dirname(filePath);
        if (dir !== '.' && dir !== '/') {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(filePath, code);
        console.log(`   ✅ Saved to ${filePath} (${code.length} bytes)\n`);
        success++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
      failed++;
    }
  }
  
  console.log(`\n✅ Phase 3 Complete!`);
  console.log(`   Success: ${success} files`);
  console.log(`   Failed: ${failed} files`);
  console.log(`\n📦 Next steps:`);
  console.log(`   1. npm install winston winston-daily-rotate-file prom-client ioredis bullmq rate-limit-redis`);
  console.log(`   2. npm install @aws-sdk/client-s3 @aws-sdk/lib-storage puppeteer-core handlebars exceljs`);
  console.log(`   3. npm install nodemailer @bull-board/express @bull-board/api`);
  console.log(`   4. Add environment variables (see phase3_plan.json task 41)`);
  console.log(`   5. Run: docker-compose up -d`);
}

run().catch(console.error);
