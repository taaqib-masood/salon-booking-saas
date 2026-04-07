```javascript
import { cidrSubnet } from 'ip';
import dotenv from 'dotenv';
import AuditLogModel from '../models/AuditLog.js';

// Load environment variables
dotenv.config();

const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(',') ?? [];

export default function ipWhitelistMiddleware(req, res, next) {
  const clientIp = req.ip;
  
  // Always allow private IPs
  if (cidrSubnet('10.0.0.0/8').contains(clientIp) ||
      cidrSubnet('172.16.0.0/12').contains(clientIp) ||
      cidrSubnet('192.168.0.0/16').contains(clientIp)) {
    return next();
  }
  
  // Check if client IP is in whitelist
  for (const ip of ADMIN_IP_WHITELIST) {
    if (cidrSubnet(ip).contains(clientIp)) {
      return next();
    }
  }
  
  // If not, create AuditLog entry and send 403 response
  const auditLog = new AuditLogModel({
    ip: clientIp,
    action: 'IP_NOT_WHITELISTED',
    details: `IP ${clientIp} attempted to access admin endpoint`
  });
  
  auditLog.save()
    .then(() => {
      res.status(403).send('Forbidden');
    })
    .catch((error) => {
      console.error('Error creating AuditLog entry:', error);
      res.status(500).send('Internal Server Error');
    });
}
```