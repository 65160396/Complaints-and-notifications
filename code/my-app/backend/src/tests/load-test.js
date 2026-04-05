import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 20,
  duration: '60s',
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function () {
  const loginRes = http.post(
    'https://ims-backend-zwh8.onrender.com/api/auth/login',
    JSON.stringify({ email: 'admin@buu.ac.th', password: 'password' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');

  const res = http.get(
    'https://ims-backend-zwh8.onrender.com/api/complaints',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  sleep(1);
}