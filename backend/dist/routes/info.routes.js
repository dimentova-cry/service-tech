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
exports.infoRouter = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const require_auth_1 = require("../middlewares/require-auth");
const require_role_1 = require("../middlewares/require-role");
// Роутер для работы с информацией
const infoRouter = (poinfoService) => {
    const router = (0, express_1.Router)();
    // Получение информации "О нас" (публичный доступ)
    router.get("/about", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const info = yield poinfoService.getAboutInfo();
            res.json(info);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Ошибка получения информации";
            res.status(400).json({ error: message });
        }
    }));
    // Обновление информации "О нас" (только для админов)
    router.put("/about", 
    // Middleware для проверки прав доступа
    (req, res, next) => {
        (0, current_user_1.currentUser)(req, res, (err) => {
            if (err)
                return next(err);
            (0, require_auth_1.requireAuth)(req, res, (err) => {
                if (err)
                    return next(err);
                (0, require_role_1.requireRole)("admin")(req, res, next);
            });
        });
    }, 
    // Обработчик обновления информации
    (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { text } = req.body;
            const info = yield poinfoService.updateAboutInfo(text);
            res.json(info);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Ошибка обновления информации";
            res.status(400).json({ error: message });
        }
    }));
    return router;
};
exports.infoRouter = infoRouter;
