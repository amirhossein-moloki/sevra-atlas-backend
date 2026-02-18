export interface TargetPlan {
  model: string;
  current: number;
  required: number;
  delta: number;
  justification: string;
}

export const printReport = (plans: TargetPlan[], mode: string) => {
  console.log('\n=================================================');
  console.log(`       COVERAGE & TARGETS REPORT (${mode})       `);
  console.log('=================================================\n');

  console.table(plans.map(p => ({
    Model: p.model,
    Current: p.current,
    Target: p.required,
    Delta: p.delta
  })));

  console.log('\nJustifications:');
  plans.forEach(p => console.log(`- ${p.model}: ${p.justification}`));
  console.log('\n=================================================\n');
};
