import { spawn } from 'child_process';
import * as path from 'path';

async function main() {
  console.log('Redirecting to modular seeder...');
  const child = spawn('npx', ['ts-node', path.join(__dirname, '../scripts/seeder/orchestrator.ts')], {
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
