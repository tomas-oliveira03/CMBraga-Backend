"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObject = validateObject;
exports.validate = validate;
const benign_error_1 = __importDefault(require("../server/errors/benign-error"));
const zod_validation_error_1 = require("zod-validation-error");
function validateObject(object, schema) {
    const result = schema.safeParse(object);
    if (result.success === false) {
        // normally as benign error
        throw new benign_error_1.default((0, zod_validation_error_1.fromZodError)(result.error).message);
    }
    return result.data;
}
function validate(req, schema) {
    return validateObject({ ...req.body, ...req.query, ...req.params }, schema);
}
