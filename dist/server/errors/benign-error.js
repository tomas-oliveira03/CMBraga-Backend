"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Error class for representing benign errors.
 * These are errors caused by user interactions and are safe to show to them.
 */
class BenignError extends Error {
    name;
    message;
    stack;
    constructor(message) {
        super(message);
        this.name = "BenignError";
        this.message = message;
    }
    toString() {
        return `${this.name}: ${this.message}`;
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            stack: this.stack,
        };
    }
}
exports.default = BenignError;
