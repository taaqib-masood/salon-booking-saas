```javascript
import process from 'process';
import http from 'http';
import url from 'url';

const args = process.argv.slice(2);
let parsedUrl;
let timeout = 5000; // default timeout in ms

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url':
      parsedUrl = url.parse(args[++i]);
      break;
    case '--timeout':
      timeout = parseInt(args[++i], 10);
      break;
    default:
      console.error('Unknown argument', args[i]);
      process.exit(2);
  }
}

if (!parsedUrl) {
  console.error('Missing --url argument');
  process.exit(3);
}

const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port,
  path: '/health',
  method: 'GET',
};

const req = http.request(options, (res) => {
  if (res.statusCode !== 200) {
    console.error('Health check failed');
    process.exit(1);
  } else {
    console.log('Health check passed');
  }
});

req.on('error', (e) => {
  console.error('Error during health check:', e.message);
  process.exit(1);
});

req.setTimeout(timeout, () => {
  req.abort();
  console.error('Health check timed out');
  process.exit(2);
});

req.end();
```