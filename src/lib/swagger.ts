import swaggerJsdoc from 'swagger-jsdoc';
import { envs } from '@/config';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CMBraga API',
            version: '1.0.0',
            description: 'API documentation for CMBraga Backend',
        },
        servers: [
            {
                url: `http://localhost:${envs.PORT}/api`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token obtained from /auth/login',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/server/routers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
