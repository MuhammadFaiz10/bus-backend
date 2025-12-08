import { Hono } from "hono";
import fs from "fs";
import path from "path";

const docs = new Hono();

// Serve the OpenAPI YAML as static text
docs.get("/openapi.yaml", (c) => {
  const filePath = path.join(process.cwd(), "src/docs/openapi.yaml");
  const yaml = fs.readFileSync(filePath, "utf8");
  return c.text(yaml, 200, {
    "Content-Type": "text/yaml",
  });
});

// Serve Swagger UI HTML
docs.get("/", (c) => {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Bus Ticketing API - Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '/docs/openapi.yaml',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout"
        });
      };
    </script>
  </body>
  </html>
  `;
  return c.html(html);
});

export default docs;
