# Dockerfile para AURA LIVE - PWA Web & Servidor de Desarrollo
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiesto de dependencias
COPY package.json ./

# Instalar todas las dependencias
RUN npm install --legacy-peer-deps

# Copiar el código fuente del proyecto
COPY . .

# Exportar la aplicación web estática de Expo
RUN npx expo export -p web --clear

# Etapa de producción servida con NGINX
FROM nginx:alpine AS runner

# Copiar la compilación web hacia NGINX
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de NGINX con deshabilitación estricta de caché
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"; \
        expires -1; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
