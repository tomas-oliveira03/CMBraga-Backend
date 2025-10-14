"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const config_1 = require("../config");
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
                url: `${config_1.envs.BASE_URL}/api`,
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
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
