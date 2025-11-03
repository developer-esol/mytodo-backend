const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
        url: `http://localhost:5001/api`,
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
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger Docs running at http://localhost:${port}/api-docs`);
}

module.exports = swaggerDocs;
