"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.sendEmail = sendEmail;
exports.createPassword = createPassword;
exports.resetPassword = resetPassword;
const config_1 = require("../../config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
function generateToken(userEmail) {
    return jsonwebtoken_1.default.sign({ userEmail }, config_1.envs.JWT_SECRET, {
        expiresIn: "24h"
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.envs.JWT_SECRET);
}
async function sendEmail({ to, subject, html }) {
    const transporter = nodemailer_1.default.createTransport({
        host: config_1.envs.SMTP_SERVER,
        port: Number(config_1.envs.SMTP_PORT),
        secure: false,
        auth: {
            user: config_1.envs.GMAIL_USERNAME,
            pass: config_1.envs.GMAIL_PASSWORD_SMTP,
        },
    });
    await transporter.sendMail({
        to,
        subject,
        html,
    });
}
async function createPassword(email, name) {
    const token = generateToken(email);
    const link = `${config_1.envs.BASE_URL}/api/auth/register/set-password?token=${token}`;
    await sendEmail({
        to: email,
        subject: "Defina a sua palavra-passe",
        html: `
        <p>Olá ${name},</p>
        <p>Foi registado na nossa plataforma.</p>
        <p>Clique no link abaixo para definir a sua palavra-passe:</p>
        <a href="${link}">${link}</a>
        <p>Este link é válido por 24 horas.</p>
        `
    });
}
async function resetPassword(email, name) {
    const token = generateToken(email);
    const link = `${config_1.envs.BASE_URL}/api/auth/register/set-password?token=${token}`;
    await sendEmail({
        to: email,
        subject: "Altere a sua palavra-passe",
        html: `
        <p>Olá ${name},</p>
        <p>Clique no link abaixo para alterar a sua palavra-passe:</p>
        <a href="${link}">${link}</a>
        <p>Este link é válido por 24 horas.</p>
        `
    });
}
