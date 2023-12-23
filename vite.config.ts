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
