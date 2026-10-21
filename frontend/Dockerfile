# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user and fix permissions
RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup \
    && chown -R nginxuser:nginxgroup /usr/share/nginx/html \
    && chown -R nginxuser:nginxgroup /var/cache/nginx \
    && chown -R nginxuser:nginxgroup /var/log/nginx \
    && chown -R nginxuser:nginxgroup /etc/nginx/conf.d \
    && touch /var/run/nginx.pid && chown nginxuser:nginxgroup /var/run/nginx.pid

# Copy nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginxuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]