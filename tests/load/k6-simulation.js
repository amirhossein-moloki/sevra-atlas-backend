import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 RPS
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000/api/v1';

export default function () {
  // 1. Search (Read-heavy)
  const searchRes = http.get(`${BASE_URL}/search?q=beauty`);
  check(searchRes, { 'search status is 200': (r) => r.status === 200 });

  sleep(1);

  // 2. Salon Listing
  const salonsRes = http.get(`${BASE_URL}/salons?city=tehran`);
  check(salonsRes, { 'salons list status is 200': (r) => r.status === 200 });

  sleep(1);

  // 3. Blog Post
  const postsRes = http.get(`${BASE_URL}/blog/posts?limit=5`);
  check(postsRes, { 'blog posts status is 200': (r) => r.status === 200 });

  if (postsRes.status === 200) {
    const posts = JSON.parse(postsRes.body).data;
    if (posts && posts.length > 0) {
      const slug = posts[0].slug;
      const postDetailRes = http.get(`${BASE_URL}/blog/posts/${slug}`);
      check(postDetailRes, { 'blog detail status is 200': (r) => r.status === 200 });
    }
  }

  sleep(1);
}
