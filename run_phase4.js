import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { askDeepSeek } from './deepseek.js';

async function run() {
  console.log('🚀 Starting Phase 4 - Advanced Features\n');
  
  if (!existsSync('phase4_plan.json')) {
    console.log('❌ phase4_plan.json not found!');
    return;
  }
  
  const plan = JSON.parse(readFileSync('phase4_plan.json', 'utf8'));
  const tasks = plan.tasks || [];
  
  console.log(`📋 Loaded ${tasks.length} tasks from phase4_plan.json\n`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const filePath = task.file_path;
    
    if (!filePath) {
      console.log(`[${i+1}/${tasks.length}] ⏭️ Skipping: No file path`);
      continue;
    }
    
    console.log(`[${i+1}/${tasks.length}] 💻 Generating: ${filePath}`);
    
    try {
      const code = await askDeepSeek(task.instructions, filePath);
      
      const dir = dirname(filePath);
      if (dir !== '.' && dir !== '/') {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(filePath, code);
      console.log(`   ✅ Saved (${code.length} bytes)\n`);
      success++;
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}\n`);
      failed++;
    }
  }
  
  console.log(`\n✅ Phase 4 Complete!`);
  console.log(`   Success: ${success} files`);
  console.log(`   Failed: ${failed} files`);
}

run().catch(console.error);
