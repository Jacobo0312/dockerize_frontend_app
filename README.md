# Dockerizing a Frontend Application

## Overview

This README details the process of dockerizing a frontend application, specifically using Vite and React, to manage different deployment stages (development, QA, production, etc.) with a single image. The approach allows for runtime injection of environment variables, maintaining control over the frontend build configuration across various stages.

## Steps

1. **Index.html Modification**:
    - In `index.html`, insert a placeholder comment for environment variables. This comment will be replaced during the build process.
    
<img width="711" alt="INDEX_IMAGE" src="https://github.com/Jacobo0312/dockerize_frontend_app/assets/72984810/7855a87c-b34b-480e-b85e-99539d95788d">

2. **Vite Configuration**:
    - In `vite.config.ts`, create a plugin function that replaces the placeholder in `index.html` with a JavaScript file containing the environment variables.

    ```tsx
    // Vite configuration with environment variable replacement plugin
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

3. **Environment Variable Handling**:
    - In the `src/config` directory, create `constants.ts` to manage environment variables.

    ```tsx
    // Handling environment variables in constants.ts
    declare global {
        interface Window {
            _env_: { [key: string]: string };
        }
    }

    export const STAGE = import.meta.env.STAGE ?? window._env_.STAGE;
    export const API_URL = import.meta.env.API_URL ?? window._env_.API_URL;
    ```

4. **Verifying Environment Variables**:
    - Ensure the environment variables are correctly set up in the application.

    <img width="1039" alt="APP_TSX_IMAGE" src="https://github.com/Jacobo0312/dockerize_frontend_app/assets/72984810/e454d866-1bef-4a81-8a55-f9628701ea5c">

5. **Nginx Configuration**:
    - Create `default.conf` for the Nginx server in the `etc/config` directory.

    ```javascript
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
    gzip_types text/plain application/javascript text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-        fontobject application/x-font-ttf font/opentype;

    error_page 500 502 503 504 /50x.html;

    location = /50x.html {
        root  /var/www/app/;
        }

    }
    ```

6. **Startup Script**:
    - Develop a `start.sh` script to generate `front.env.js` with environment variables provided by the CI/CD pipeline.

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

7. **Dockerfile Creation**:
    - Create a Dockerfile to build and run the application.

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

8. **Docker Compose for Simulation**:
    - Use Docker Compose to simulate a CI/CD environment.

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

9. **Running Docker Compose**:
    - Execute the Docker Compose command to start the application.

    ```powershell
    - docker-compose up
    ```
<img width="1440" alt="STAGE_QAS" src="https://github.com/Jacobo0312/dockerize_frontend_app/assets/72984810/eedd26d9-c1ba-4957-a85b-47e7b5b70844">


## Changing Environment Variables

To alter environment variables, modify the Docker Compose file accordingly:

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
      - STAGE=PROD
      - API_URL=http://example.com/api
```

<img width="1440" alt="STAGE_PROD" src="https://github.com/Jacobo0312/dockerize_frontend_app/assets/72984810/6bd961af-98e1-4d55-b09d-a23a01e1a072">

