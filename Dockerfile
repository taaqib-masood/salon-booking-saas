```Dockerfile
# Dockerfile

# Stage 1 - Builder
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 - Production
FROM node:20-alpine AS production
LABEL maintainer="Your Name <your.email@example.com>"
WORKDIR /usr/src/app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next .
USER node
CMD [ "dumb-init", "npm", "start" ]
HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost:${PORT:-80}/ || exit 1
```