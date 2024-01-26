# Dockerizing a Frontend Application

## Overview

This README details the process of dockerizing a frontend application, specifically using Vite and React, to manage different deployment stages (development, QA, production, etc.) with a single image. The approach allows for runtime injection of environment variables, maintaining control over the frontend build configuration across various stages.

## Steps

1. **Index.html Modification**:
    - In `index.html`, insert a placeholder comment for environment variables. This comment will be replaced during the build process.
    
    ![index.html Screenshot](image URL here)

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

    ![src/App.tsx Screenshot](image URL here)

5. **Nginx Configuration**:
    - Create `default.conf` for the Nginx server in the `etc/config` directory.

    ```json
    // Nginx server configuration
    [Nginx server configuration content]
    ```

6. **Startup Script**:
    - Develop a `start.sh` script to generate `front.env.js` with environment variables provided by the CI/CD pipeline.

    ```bash
    # Startup script to configure environment variables
    [start.sh script content]
    ```

7. **Dockerfile Creation**:
    - Create a Dockerfile to build and run the application.

    ```docker
    # Dockerfile for building and running the application
    [Dockerfile content]
    ```

8. **Docker Compose for Simulation**:
    - Use Docker Compose to simulate a CI/CD environment.

    ```yaml
    # Docker Compose configuration for CI/CD simulation
    [Docker Compose YAML content]
    ```

9. **Running Docker Compose**:
    - Execute the Docker Compose command to start the application.

    ```powershell
    - docker-compose up
    ```

    ![Docker Compose Execution Screenshot](image URL here)

## Changing Environment Variables

To alter environment variables, modify the Docker Compose file accordingly:

```yaml
# Docker Compose configuration with different environment variables
[Docker Compose YAML content for different environment variables]
