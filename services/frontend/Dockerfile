# Frontend build and runtime image
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Try npm, then yarn, then pnpm (only one will succeed depending on lockfile present)
RUN if [ -f package-lock.json ]; then npm ci; \
elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install --frozen-lockfile; \
else npm install; fi
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Add nginx config without requiring bash
RUN set -e; \
  cat > /etc/nginx/conf.d/default.conf <<'CONF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  add_header X-Frame-Options SAMEORIGIN;
  add_header X-Content-Type-Options nosniff;
  add_header Referrer-Policy no-referrer-when-downgrade;
  add_header Cache-Control "public, max-age=300";

  location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /openmetadata/ {
    proxy_pass http://backend:8000/openmetadata/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / { try_files $uri /index.html =404; }
}
CONF

EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/healthz.html || exit 1
