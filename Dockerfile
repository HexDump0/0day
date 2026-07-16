# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# install deps against the lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# build the Vite static site into /app/dist
COPY . .
RUN npm run build

# --- serve stage ---
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
