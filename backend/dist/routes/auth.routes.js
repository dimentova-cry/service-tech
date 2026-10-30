"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validate_request_1 = require("../middlewares/validate-request");
const current_user_1 = require("../middlewares/current-user");
// Роутер для аутентификации
const authRouter = (authService) => {
    const router = (0, express_1.Router)();
    // Эндпоинт для входа в систему
    router.post("/login", [
        // Валидация входных данных
        (0, express_validator_1.body)("login").trim().notEmpty().withMessage("Логин обязателен"),
        (0, express_validator_1.body)("password").trim().notEmpty().withMessage("Пароль обязателен"),
        (0, express_validator_1.body)("roleType")
            .isIn(["admin", "staff", "client"])
            .withMessage("Недопустимый тип роли"),
    ], validate_request_1.validateRequest, // Middleware для проверки валидации
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { login, password, roleType } = req.body;
            // Аутентификация через сервис
            const data = yield authService.login(login, password, roleType);
            res.json(data);
        }
        catch (error) {
            // Обработка ошибок аутентификации
            const errorMessage = error instanceof Error ? error.message : "Ошибка аутентификации";
            res.status(401).json({ error: errorMessage });
        }
    }));
    // Эндпоинт для получения информации о текущем пользователе
    router.get("/me", (req, res) => {
        // Проверка аутентификации через middleware
        (0, current_user_1.currentUser)(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
            if (req.currentUser) {
                // Обновление токена через сервис
                const userSmallInfo = req.currentUser;
                const data = yield authService.refresh(userSmallInfo);
                res.json(data);
            }
            else {
                res.status(401).json({ error: "Не авторизован" });
            }
        }));
    });
    return router;
};
exports.authRouter = authRouter;
