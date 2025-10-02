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
        
    },
    apis: ['./src/server/routers/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
