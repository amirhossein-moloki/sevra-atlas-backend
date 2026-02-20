import { spawn } from 'child_process';
import * as path from 'path';

async function main() {
  console.log('Redirecting to modular seeder...');

  const isProduction = process.env.NODE_ENV === 'production';
  const isDist = __dirname.includes('dist');

  let command: string;
  let args: string[];

  if (isProduction || isDist) {
    command = 'node';
    // When running from dist/prisma/seed.js, the orchestrator is at ../scripts/seeder/orchestrator.js
    const orchestratorPath = path.join(__dirname, '../scripts/seeder/orchestrator.js');
    args = [orchestratorPath, ...process.argv.slice(2)];
  } else {
    command = 'npx';
    const orchestratorPath = path.join(__dirname, '../scripts/seeder/orchestrator.ts');
    args = ['ts-node', orchestratorPath, ...process.argv.slice(2)];
  }

  console.log(`Running seeder with command: ${command} ${args.join(' ')}`);

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, TS_NODE_PROJECT: 'tsconfig.json' }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
