const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyToDoo API',
      version: '1.0.0',
      description: 'API documentation for MyToDoo application',
    },
    servers: [
      {
        url: `http://localhost:5001`,
      },
    ],
  },
  apis: ['./routes/docs/*.js'], 
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app, port) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger Docs running at http://localhost:${port}/api-docs`);
}

module.exports = swaggerDocs;
