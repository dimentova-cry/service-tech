"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware для валидации входящих запросов
 * Проверяет результаты валидации и возвращает ошибки, если они есть
 */
const validateRequest = (req, res, next) => {
    // Получаем результаты валидации из запроса
    const errors = (0, express_validator_1.validationResult)(req);
    // Если есть ошибки валидации
    if (!errors.isEmpty()) {
        // Возвращаем статус 400 с массивом ошибок
        res.status(400).json({
            errors: errors.array(), // Преобразуем ошибки в массив
        });
        return;
    }
    // Если ошибок нет, передаем управление следующему обработчику
    next();
};
exports.validateRequest = validateRequest;
