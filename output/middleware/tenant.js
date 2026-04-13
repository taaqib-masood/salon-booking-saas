import express from 'express';
import { Tenant } from '../models/index.js';

export async function resolveTenant(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || req.subdomains[0];
  
  if (!tenantId) return res.status(403).send('Missing X-Tenant-ID header or subdomain');

  try {
    const tenant = await Tenant.findOne({ slug: tenantId });
    
    if (!tenant || !tenant.isActive || new Date() > tenant.planExpiry) return res.status(403).send('Tenant not found, inactive or plan expired');
  
    req.tenant = tenant;
  } catch (error) {
    console.log(error);
    return res.status(500).send('Internal server error');
  }

  next();
}

export function requireTenant() {
  return async (req, res, next) => {
    if (!req.tenant) return res.status(403).send('Missing X-Tenant-ID header or subdomain');
    
    next();
  };
}