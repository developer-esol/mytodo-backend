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
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? `http://134.199.172.167:5001/api`
            : `http://localhost:5001/api`,
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
      {
        url: `http://134.199.172.167:5001/api`,
        description: "Development server (HTTP)",
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
  apis: [
    "./routes/v1/users/userRoutes.swagger.yaml",
    "./routes/v1/auth/auth.swagger.yaml",
    "./routes/v1/auth/twoFactorAuth.swagger.yaml",
    "./routes/v1/categories/category.swagger.yaml",
    "./routes/v1/chat/chat.swagger.yaml",
    "./routes/v1/chat/firebase.swagger.yaml",
    "./routes/v1/notifications/notifications.swagger.yaml",
    "./routes/v1/payments/payment.swagger.yaml",
    "./routes/v1/payments/receipt.swagger.yaml",
    "./routes/v1/payments/serviceFee.swagger.yaml",
    "./routes/v1/reviews/review.swagger.yaml",
    "./routes/v1/tasks/task.swagger.yaml",
    "./routes/v1/users/userReview.swagger.yaml",
    "./routes/v1/admin/admin.swagger.yaml",
  ],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app, port) {
  // Swagger UI configuration with explicit HTTP scheme
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      urls: [
        {
          url: `http://134.199.172.167:5001/api-docs/swagger.json`,
          name: "Production Server (HTTP)",
        },
        {
          url: `http://localhost:5001/api-docs/swagger.json`,
          name: "Local Server",
        },
      ],
      // Force HTTP scheme for all assets and API calls
      validatorUrl: null, // Disable validator to prevent HTTPS calls
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      // Explicitly set the base URL scheme to HTTP
      ...(process.env.NODE_ENV === "production" && {
        url: `http://134.199.172.167:5001/api-docs/swagger.json`,
      }),
    },
    // Custom CSS to ensure no HTTPS asset loading
    customCss: `
      .swagger-ui .topbar { display: none }
    `,
    customSiteTitle: "MyToDoo API Documentation",
    // Explicitly set HTTP scheme
    swaggerUrl:
      process.env.NODE_ENV === "production"
        ? `http://134.199.172.167:5001/api-docs/swagger.json`
        : `http://localhost:5001/api-docs/swagger.json`,
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
