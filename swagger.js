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
        url: `http://localhost:5001/api`,
        description: "Local development server",
      },
      {
        url: `http://134.199.172.167:5001/api`,
        description: "Production server (HTTP)",
      },
    ],
  },
  apis: [
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
    "./routes/v1/users/userRoutes.swagger.yaml",
    "./routes/v1/users/userReviewRoutes.swagger.yaml",
  ],
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app, port) {
  // Swagger UI configuration
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
    },
  };

  app.use("/api-docs", swaggerUi.serve);
  app.get("/api-docs", swaggerUi.setup(swaggerSpec, swaggerOptions));

  // Serve swagger spec as JSON
  app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
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
