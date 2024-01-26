# Dockerize a frontend app

## Use cases

When you use containers to run your frontend applications in different stages such as dev, qas, prod and others, and use a pipeline to automate deployments, you lose control of the frontend build to inject different environment variables.

With need a only image for different stages and in time on run container inject environment variables. we use a Vite + React project as an example.

1. In the index.html file, created a comment <!-- ENV -→

![index.html](https://prod-files-secure.s3.us-west-2.amazonaws.com/dd7140e5-2437-4acc-bb70-d6fff84f380d/2b3fbd27-8366-4709-8fbb-5600ce2d854d/Untitled.png)

index.html

1. Create a plugin replacement function in the **vite.config.ts** file, this function at compile time replaces the comment in index.html by the javascript file with the environment variables for the respective stage.

```tsx
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const replacePlugin = () => {
  return {
    name: "html-inject-env",
    transformIndexHtml: (html) => {
      return html.replace(
        "<!-- ENV -->",
        `<script src="./config/front.env.js"></script>`
      );
    },
  };
};

export default defineConfig({
  plugins: [react(), replacePlugin()],
});
```

1. In src we create a constants.ts file in the config directory that is responsible for bringing the environment variables.

```tsx
declare global {
    interface Window {
        _env_: { [key: string]: string };
    }
}

export const STAGE = import.meta.env.STAGE ?? window._env_.STAGE;
export const API_URL = import.meta.env.API_URL ?? window._env_.API_URL;
```

1. Now, we show the environment variables to verify.

![src/App.tsx](https://prod-files-secure.s3.us-west-2.amazonaws.com/dd7140e5-2437-4acc-bb70-d6fff84f380d/490bb295-d860-4751-90c7-50a21380e0a0/Untitled.png)

src/App.tsx

1. Create a config file **“default.conf”** for nginx server in directory etc/config

```json
server {
    listen   80;
    listen   [::]:80 default ipv6only=on;

    location / {
        root  /var/www/app/;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    server_tokens  off;
    server_name _;

    gzip on;
    gzip_disable "msie6";

    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 0;
    gzip_types text/plain application/javascript text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;

    error_page 500 502 503 504 /50x.html;

    location = /50x.html {
        root  /var/www/app/;
    }

}
```

1. We create a [start.sh](http://start.sh/) script that creates a front.env.js file that has variable environment variables from the variables delivered by the (continuous integration) CD pipeline.

```bash
#!/bin/sh

# List of environment variables
ENV_VARS="STAGE API_URL"

echo "Configuring environment variables..."

mkdir -p /var/www/app/config/

echo 'window._env_ = {' > /var/www/app/config/front.env.js

# Iterate over the environment variables and add them to the file
for prefix in $ENV_VARS; do
  for var in $(env | grep -E "^$prefix" | awk -F= '{print $1}'); do
    value=$(eval echo "\$$var")  # Get the value of the variable
    echo "    $var: \"$value\"," >> /var/www/app/config/front.env.js
  done
done

echo "};" >> /var/www/app/config/front.env.js

echo "Starting Nginx..."

nginx -g "daemon off;"
```

1. Create a Dockerfile

```docker
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json  ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.19-alpine AS server

COPY ./etc/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /var/www/app/

COPY start.sh /start.sh

RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
```

When the container is run it immediately executes the [start.sh](http://start.sh/) script that provides the environment variables in a configuration directory.

1. For example, we use a docker compose to simulate CD situation.

```yaml
version: "3"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./src:/app/src
    ports:
      - "3000:80"
    environment:
      - STAGE=QAS
      - API_URL=http://example.qas.com/api
```

1. Execute docker compose

```powershell
- docker-compose up
```

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/dd7140e5-2437-4acc-bb70-d6fff84f380d/896df340-4646-4628-8590-37e582de7882/Untitled.png)

If change environment variables 

```powershell
version: "3"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./src:/app/src
    ports:
      - "3000:80"
    environment:
      - STAGE=PROD
      - API_URL=http://example.com/api
```

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/dd7140e5-2437-4acc-bb70-d6fff84f380d/0db05a29-cf9f-4784-9d7c-91cb8128b35e/Untitled.png)
