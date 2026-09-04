# Build Vite (variables VITE_* se inyectan en build-time)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# URL del backend tal como la ve el navegador del usuario (no uses host "api" del compose: el JS corre en el cliente)
ARG VITE_BACKEND_URL=http://localhost:5000
ARG VITE_API_URL=
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_API_URL=$VITE_API_URL

# `npm run build` incluye tsc; en Docker suele fallar con JSX sin tipar. Vite compila el bundle correctamente.
RUN npx vite build

# Servir estáticos + SPA (React Router)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
