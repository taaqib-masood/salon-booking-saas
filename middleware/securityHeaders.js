```javascript
import helmet from 'helmet';
import cors from 'cors';

export const configureSecurityHeaders = (app) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"]
      }
    },
    hsts: { maxAge: 63072000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' }
  }));
  
  app.disable('x-powered-by');
};

export const corsOptions = {
  origin: ['http://localhost:3000'], // replace with your trusted origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true
};
```