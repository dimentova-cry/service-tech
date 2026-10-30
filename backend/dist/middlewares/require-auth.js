"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
// Middleware для проверки аутентификации пользователя
const requireAuth = (req, res, next) => {
    // Проверка наличия информации о пользователе в запросе
    if (!req.currentUser) {
        // Отправка 401 ошибки если пользователь не аутентифицирован
        res.status(401).json({ error: "Authentication required" });
        return;
    }
    // Продолжение выполнения цепочки middleware если аутентификация успешна
    next();
};
exports.requireAuth = requireAuth;
