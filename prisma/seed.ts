import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('Redirecting to modular seeder...');

  const isProduction = process.env.NODE_ENV === 'production';
  const isDist = __dirname.includes('dist');

  let command: string;
  let args: string[];

  // Define potential paths for the orchestrator
  const distOrchestrator = isDist
    ? path.join(__dirname, '../scripts/seeder/orchestrator.js')
    : path.join(__dirname, '../dist/scripts/seeder/orchestrator.js');

  const sourceOrchestrator = isDist
    ? path.join(__dirname, '../../scripts/seeder/orchestrator.ts')
    : path.join(__dirname, '../scripts/seeder/orchestrator.ts');

  if (fs.existsSync(distOrchestrator)) {
    console.log(`Found compiled orchestrator at: ${distOrchestrator}`);
    command = 'node';
    args = [distOrchestrator, ...process.argv.slice(2)];
  } else if (fs.existsSync(sourceOrchestrator)) {
    console.log(`Found source orchestrator at: ${sourceOrchestrator}`);
    command = 'npx';
    args = ['ts-node', sourceOrchestrator, ...process.argv.slice(2)];
  } else {
    console.error('Could not find orchestrator at:');
    console.error(`- ${distOrchestrator}`);
    console.error(`- ${sourceOrchestrator}`);
    process.exit(1);
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
