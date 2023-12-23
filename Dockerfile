FROM node:20-slim AS build

WORKDIR /app

COPY package*.json  ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.19-alpine AS server

COPY ./etc/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /var/www/app/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

