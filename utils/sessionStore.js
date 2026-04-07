```javascript
import redis from 'redis';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

const client = redis.createClient();
client.on('error', console.log);

export const storeRefreshToken = async (userId, token) => {
  await promisify(client.set).bind(client)(`refresh:${userId}`, token);
};

export const validateRefreshToken = async (userId, token) => {
  const storedToken = await promisify(client.get).bind(client)(`refresh:${userId}`);
  return storedToken === token;
};

export const rotateRefreshToken = async (userId, oldToken, newToken) => {
  const isValid = await validateRefreshToken(userId, oldToken);
  if (!isValid) throw new Error('Invalid refresh token');
  await storeRefreshToken(userId, newToken);
};

export const revokeRefreshToken = async (userId, token) => {
  const isValid = await validateRefreshToken(userId, token);
  if (!isValid) throw new Error('Invalid refresh token');
  await promisify(client.del).bind(client)(`refresh:${userId}`);
};

export const revokeAllUserTokens = async (userId) => {
  await promisify(client.keys).bind(client)(`refresh:${userId}*`, (err, keys) => {
    if (!keys.length) return;
    const multi = client.multi();
    keys.forEach((key) => multi.del(key));
    multi.exec();
  });
};

export const getActiveSessions = async (userId) => {
  const sessions = await promisify(client.keys).bind(client)(`refresh:${userId}*`);
  return sessions.map((session) => jwt.decode(session));
};
```