"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware для проверки и верификации JWT токена
const currentUser = (req, res, next) => {
    var _a;
    // Извлечение токена из заголовка Authorization
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    // Если токена нет, пропускаем дальше
    if (!token) {
        return next();
    }
    try {
        // Верификация токена
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Добавление информации о пользователе в запрос
        req.currentUser = payload;
    }
    catch (err) {
        // Ошибка верификации игнорируется (неавторизованный доступ)
    }
    // Передача управления следующему middleware
    next();
};
exports.currentUser = currentUser;
