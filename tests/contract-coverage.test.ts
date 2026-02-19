import * as fs from 'fs';
import * as path from 'path';

describe('Contract Coverage Enforcement', () => {
  it('should have 100% endpoint coverage in tests', () => {
    const reportPath = path.join(process.cwd(), 'TEST_AUDIT_REPORT.md');

    if (!fs.existsSync(reportPath)) {
        console.warn('TEST_AUDIT_REPORT.md not found');
        return;
    }

    const report = fs.readFileSync(reportPath, 'utf8');
    const missingMatch = report.match(/\*\*Missing Endpoints:\*\* (\d+)/);

    if (!missingMatch) {
      throw new Error('Could not parse TEST_AUDIT_REPORT.md');
    }

    const missingCount = parseInt(missingMatch[1], 10);

    if (missingCount > 0) {
      const missingList = report.split('## Missing Endpoints')[1].split('##')[0];
      throw new Error(`Endpoint coverage is not 100%. Missing ${missingCount} endpoints:\n${missingList}`);
    }

    expect(missingCount).toBe(0);
  });
});
