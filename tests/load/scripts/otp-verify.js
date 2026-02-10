const autocannon = require('autocannon');

async function runOtpVerifyLoadTest(targetUrl) {
  console.log(`Starting load test for OTP Verify at ${targetUrl}/api/v1/auth/otp/verify`);

  const result = await autocannon({
    url: `${targetUrl}/api/v1/auth/otp/verify`,
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: '+989123456789',
      code: '123456'
    }),
    connections: 10,
    pipelining: 1,
    duration: 10
  });

  return result;
}

if (require.main === module) {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  runOtpVerifyLoadTest(targetUrl).then(result => {
    console.log(autocannon.printResult(result));
  }).catch(console.error);
}

module.exports = runOtpVerifyLoadTest;
