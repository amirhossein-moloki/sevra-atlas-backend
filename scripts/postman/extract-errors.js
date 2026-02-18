const fs = require('fs');
const path = require('path');

const reportPath = process.argv[2] || 'reports/newman-report.json';
if (!fs.existsSync(reportPath)) {
    console.error(`Report not found at ${reportPath}`);
    process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Newman report can have environment in different places depending on version/reporter
// Usually it's in report.environment.values
const envValues = report.environment ? report.environment.values : [];
const errorLogEntry = envValues.find(v => v.key === 'errorLog');
const errors = errorLogEntry ? JSON.parse(errorLogEntry.value) : [];

const totalRequests = report.run.stats.requests.total;
const failedRequests = errors.length;

let md = `# Newman Execution Error Report\n\n`;
md += `- **Total Requests**: ${totalRequests}\n`;
md += `- **Errors Captured**: ${failedRequests}\n`;
md += `- **Timestamp**: ${new Date().toISOString()}\n\n`;

if (errors.length > 0) {
    md += `## Error Breakdown\n\n`;
    md += `| Request Name | Method | Status | Error Snippet |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    errors.forEach(e => {
        const snippet = (e.responseSnippet || e.error || '').replace(/\n/g, ' ').substring(0, 100);
        md += `| ${e.requestName} | ${e.method} | ${e.status} | ${snippet}... |\n`;
    });
} else {
    md += `✅ No errors captured in the non-blocking system.\n`;
}

if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
}

fs.writeFileSync('reports/errors.json', JSON.stringify(errors, null, 2));
fs.writeFileSync('reports/errors.md', md);

console.log(`Extracted ${errors.length} errors to reports/errors.json and reports/errors.md`);
