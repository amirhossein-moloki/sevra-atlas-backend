const autocannon = require('autocannon');

async function runRefreshLoadTest(targetUrl) {
  console.log(`Starting load test for Token Refresh at ${targetUrl}/api/v1/auth/refresh`);

  const result = await autocannon({
    url: `${targetUrl}/api/v1/auth/refresh`,
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      refreshToken: 'some-dummy-refresh-token'
    }),
    connections: 10,
    pipelining: 1,
    duration: 10
  });

  return result;
}

if (require.main === module) {
  const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
  runRefreshLoadTest(targetUrl).then(result => {
    console.log(autocannon.printResult(result));
  }).catch(console.error);
}

module.exports = runRefreshLoadTest;
