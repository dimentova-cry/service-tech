"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
// Фабрика middleware для проверки ролей пользователя
const requireRole = (...roles) => {
    return (req, res, next) => {
        // Проверка наличия пользователя и соответствия роли
        if (!req.currentUser || !roles.includes(req.currentUser.role)) {
            // Отправка 403 ошибки если доступ запрещен
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        // Продолжение выполнения если проверка пройдена
        next();
    };
};
exports.requireRole = requireRole;
