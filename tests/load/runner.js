const runOtpRequestLoadTest = require('./scripts/otp-request');
const runOtpVerifyLoadTest = require('./scripts/otp-verify');
const runRefreshLoadTest = require('./scripts/refresh');
const autocannon = require('autocannon');

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';

async function runAllLoadTests() {
  console.log('--- Starting Load Test Suite ---');

  const otpRequestResult = await runOtpRequestLoadTest(targetUrl);
  console.log('OTP Request Result:');
  console.log(autocannon.printResult(otpRequestResult));

  const otpVerifyResult = await runOtpVerifyLoadTest(targetUrl);
  console.log('OTP Verify Result:');
  console.log(autocannon.printResult(otpVerifyResult));

  const refreshResult = await runRefreshLoadTest(targetUrl);
  console.log('Token Refresh Result:');
  console.log(autocannon.printResult(refreshResult));

  console.log('--- Load Test Suite Completed ---');
}

runAllLoadTests().catch(err => {
  console.error('Error running load tests:', err);
  process.exit(1);
});
