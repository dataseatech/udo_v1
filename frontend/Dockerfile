# Stage 1: Build the React application
FROM node:latest as builder

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./

RUN if [ -f yarn.lock ]; then yarn install; elif [ -f package-lock.json ]; then npm install; else echo "No lock file found."; fi

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:latest

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]