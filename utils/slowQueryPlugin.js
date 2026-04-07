```javascript
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import { alertSlowQuery } from './alertSlowQuery.js';

const SLOW_QUERY_THRESHOLD_MS = 500; // Adjust as needed

function slowQueryPlugin(schema) {
  const methods = ['find', 'findOne', 'findOneAndUpdate', 'aggregate', 'save'];

  methods.forEach((methodName) => {
    const originalMethod = schema.methods[methodName];

    schema.methods[methodName] = async function () {
      const startTime = performance.now();
      try {
        return await originalMethod.apply(this, arguments);
      } finally {
        const endTime = performance.now();
        const durationMs = endTime - startTime;

        if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
          alertSlowQuery({ methodName, durationMs });
        }
      }
    };
  });
}

mongoose.plugin(slowQueryPlugin);
```