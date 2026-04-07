import createError from 'http-errors';

export function addTenantFilter(query, tenantId) {
    return query.where({ tenantId });
}

export function requirePlanFeature(tenant, feature) {
    if (!tenant || !tenant[feature]) {
        throw createError(403);
    }
}

export function checkLimit(tenant, resource, currentCount) {
    const limit = tenant.plan[resource + 'Limit'];
    if (currentCount >= limit) {
        throw createError(429, `Plan limit for ${resource} exceeded`);
    }
}