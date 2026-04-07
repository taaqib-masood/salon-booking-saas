```javascript
import client from 'prom-client';
import responseTime from 'response-time';

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests made.',
  labelNames: ['method', 'route', 'code'],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds.',
});

const salonAppointmentsTotal = new client.Counter({
  name: 'salon_appointments_total',
  help: 'Total number of appointments made at the salon.',
});

const salonRevenueAed = new client.Gauge({
  name: 'salon_revenue_aed',
  help: 'Current revenue of the salon in AED.',
});

client.collectDefaultMetrics();

function recordHttpMetrics(req, res, time) {
  if (req._startTime) {
    const method = req.method;
    const route = req.route ? req.route.path : 'unknown';
    const code = res.statusCode;
    const duration = time / 1000;

    httpRequestsTotal.inc({ method, route, code });
    httpRequestDurationSeconds.observe(duration);
  }
}

function getMetrics() {
  return client.register.metrics();
}

export { recordHttpMetrics, getMetrics };
```