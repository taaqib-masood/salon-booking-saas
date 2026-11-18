import Layer from 'express/lib/router/layer.js';

// Express 4 ignores rejected promises from async handlers; forward them to the error handler.
// shortcut: patches Express 4 internals, drop when upgrading to Express 5 (native support).
Layer.prototype.handle_request = function handle(req, res, next) {
  const fn = this.handle;
  if (fn.length > 3) return next();
  try {
    const result = fn(req, res, next);
    if (typeof result?.catch === 'function') result.catch(next);
  } catch (err) {
    next(err);
  }
};
