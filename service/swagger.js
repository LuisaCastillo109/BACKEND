const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "API Usuarios",
            version: "1.0.0",
            description: "Documentación de mi API"
        },

        servers: [
            {
                url: "http://localhost:3014"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },

        security: [
            {
                bearerAuth: []
            }
        ]
    },

    apis: ["../Routes/usuario.router.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;