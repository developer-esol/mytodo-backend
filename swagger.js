const path = require("path");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const logger = require("./config/logger");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MyToDoo API",
      version: "1.0.0",
      description: "API documentation for MyToDoo application",
    },
    // Include both servers so you can switch in Swagger UI; order depends on environment
    servers:
      process.env.NODE_ENV === "production"
        ? [
            {
              url: `http://134.199.172.167:5001/api`,
              description: "Production server",
            },
            {
              url: `http://localhost:5001/api`,
              description: "Local development server",
            },
          ]
        : [
            {
              url: `http://localhost:5001/api`,
              description: "Local development server",
            },
            {
              url: `http://134.199.172.167:5001/api`,
              description: "Production server",
            },
          ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
        firebaseAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your Firebase JWT token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Load all YAML files automatically and manually specify route files
  apis: [
    path.join(__dirname, "routes/v1/**/*.swagger.yaml"),
    path.join(__dirname, "routes/v1/**/*.js"),
  ],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app, port) {
  // Swagger UI configuration with explicit HTTP scheme
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      // Do not force a remote JSON; we pass the spec directly below
      validatorUrl: null,
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
    },
    customCss: `
      .swagger-ui .topbar { display: none }
    `,
    customSiteTitle: "MyToDoo API Documentation",
  };

  // Add middleware to force HTTP headers for Swagger routes
  app.use("/api-docs", (req, res, next) => {
    // Prevent any HTTPS upgrade headers
    res.removeHeader("Strict-Transport-Security");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:"
    );
    next();
  });

  app.use("/api-docs", swaggerUi.serve);
  app.get("/api-docs", swaggerUi.setup(swaggerSpec, swaggerOptions));

  // Serve swagger spec as JSON with explicit HTTP headers
  app.get("/api-docs/swagger.json", (req, res) => {
    res.removeHeader("Strict-Transport-Security");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(swaggerSpec);
  });

  const serverUrl =
    process.env.NODE_ENV === "production"
      ? `http://134.199.172.167:${port}/api-docs`
      : `http://localhost:${port}/api-docs`;

  logger.info("Swagger Docs initialized", {
    file: "swagger.js",
    url: serverUrl,
    environment: process.env.NODE_ENV || "development",
  });
}

module.exports = swaggerDocs;
