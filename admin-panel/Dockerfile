FROM node:20-alpine AS build
WORKDIR /app

# Bağımlılıkları kopyala ve kur (admin-panel dizininden)
COPY admin-panel/package*.json ./
# package-lock yoksa ci hata verir; bu nedenle install kullanıyoruz
RUN npm install --no-fund --no-audit

# Kaynakları kopyala ve üretim build'i al
COPY admin-panel/. .
RUN npm run build

# Static dosyaları Nginx ile servis et
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Basit healthcheck dosyası
RUN printf 'ok\n' > /usr/share/nginx/html/health.txt

# Nginx default port
EXPOSE 80

