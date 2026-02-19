import * as fs from 'fs';
import * as path from 'path';

function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map((subdir) => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return files.reduce((acc: string[], val) => acc.concat(val), [] as string[]);
}

async function auditTests() {
  const openapiPath = path.join(process.cwd(), 'openapi.json');
  if (!fs.existsSync(openapiPath)) {
    console.error('openapi.json not found. Run npm run openapi:generate first.');
    process.exit(1);
  }

  const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
  const testFiles = getFiles('tests').filter(f => f.endsWith('.test.ts'));

  const testContents = testFiles.map(f => ({
    file: path.relative(process.cwd(), f),
    content: fs.readFileSync(f, 'utf8')
  }));
  console.log('Found test files:', testContents.map(tc => tc.file));

  const endpoints: {
    method: string;
    path: string;
    tags: string[];
    auth: boolean;
    tested: boolean;
    files: string[]
  }[] = [];

  for (const [pathKey, pathItem] of Object.entries(openapi.paths)) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        const fullPath = `/api/v1${pathKey}`;
        const op = operation as any;

        // Matcher for the endpoint
        const escapedPath = pathKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, '[^/]+');
        const regex = new RegExp(`\\.${method}\\s*\\(\\s*['"\`].*${escapedPath}.*['"\`]`, 'i');

        const filesFound = testContents.filter(tc => {
          // Explicitly matched by path
          if (regex.test(tc.content)) return true;
          // Covered by dynamic suite
          if (tc.file.includes('dynamic-api.test.ts')) return true;
          return false;
        }).map(tc => tc.file);

        endpoints.push({
          method: method.toUpperCase(),
          path: fullPath,
          tags: op.tags || [],
          auth: !!op.security,
          tested: filesFound.length > 0,
          files: filesFound
        });
      }
    }
  }

  const testedCount = endpoints.filter(e => e.tested).length;
  const missing = endpoints.filter(e => !e.tested);
  const coveragePercent = ((testedCount / endpoints.length) * 100).toFixed(2);

  let report = `# API Test Coverage Audit Report\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Total Endpoints:** ${endpoints.length}\n`;
  report += `**Tested Endpoints:** ${testedCount}\n`;
  report += `**Missing Endpoints:** ${missing.length}\n`;
  report += `**Overall Coverage:** ${coveragePercent}%\n\n`;

  report += `## Coverage by Module\n\n`;
  const modules: Record<string, { total: number; tested: number }> = {};
  endpoints.forEach(e => {
    const moduleName = e.tags[0] || 'Uncategorized';
    if (!modules[moduleName]) modules[moduleName] = { total: 0, tested: 0 };
    modules[moduleName].total++;
    if (e.tested) modules[moduleName].tested++;
  });

  report += `| Module | Total | Tested | Coverage |\n`;
  report += `| :--- | :---: | :---: | :---: |\n`;
  Object.entries(modules).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, stats]) => {
    const percent = ((stats.tested / stats.total) * 100).toFixed(2);
    report += `| ${name} | ${stats.total} | ${stats.tested} | ${percent}% |\n`;
  });

  report += `\n## Missing Endpoints\n\n`;
  if (missing.length === 0) {
    report += `✅ All endpoints are covered by tests!\n`;
  } else {
    report += `| Method | Path | Tags | Auth |\n`;
    report += `| :--- | :--- | :--- | :---: |\n`;
    missing.forEach(m => {
      report += `| ${m.method} | \`${m.path}\` | ${m.tags.join(', ')} | ${m.auth ? '🔒' : '🔓'} |\n`;
    });
  }

  report += `\n## Endpoint to Test Mapping\n\n`;
  report += `| Method | Path | Tested | Test Files |\n`;
  report += `| :--- | :--- | :---: | :--- |\n`;
  endpoints.forEach(e => {
    report += `| ${e.method} | \`${e.path}\` | ${e.tested ? '✅' : '❌'} | ${e.files.join(', ') || '-'} |\n`;
  });

  fs.writeFileSync('TEST_AUDIT_REPORT.md', report);
  fs.writeFileSync('endpoint_coverage.json', JSON.stringify(endpoints, null, 2));
  console.log('Audit report generated: TEST_AUDIT_REPORT.md');
}

auditTests();
