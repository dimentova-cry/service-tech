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
exports.appealRouter = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const require_auth_1 = require("../middlewares/require-auth");
const require_role_1 = require("../middlewares/require-role");
const appealRouter = (appealService) => {
    const router = (0, express_1.Router)();
    // Получение новых заявок
    router.get("/new", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("admin", "staff", "client"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (req.currentUser.role === "client") {
                const appeals = yield appealService.getNewAppealsByClientId(req.currentUser.id);
                res.json(appeals);
                return;
            }
            if (req.currentUser.role === "staff") {
                const appeals = yield appealService.getNewAppealsForStaff(req.currentUser.id);
                res.json(appeals);
                return;
            }
            const appeals = yield appealService.getNewAppeals();
            res.json(appeals);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    // Получение заявок в работе
    router.get("/in-progress", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("admin", "staff", "client"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (req.currentUser.role === "client") {
                const appeals = yield appealService.getAppealsInProgressByClientId(req.currentUser.id);
                res.json(appeals);
                return;
            }
            if (req.currentUser.role === "staff") {
                const appeals = yield appealService.getAppealsInProgressForStaff(req.currentUser.id);
                res.json(appeals);
                return;
            }
            const appeals = yield appealService.getAppealsInProgress();
            res.json(appeals);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    // Получение завершенных заявок
    router.get("/completed", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("admin", "staff", "client"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (req.currentUser.role === "client") {
                const appeals = yield appealService.getCompletedAppealsByClientId(req.currentUser.id);
                res.json(appeals);
                return;
            }
            if (req.currentUser.role === "staff") {
                const appeals = yield appealService.getCompletedAppealsForStaff(req.currentUser.id);
                res.json(appeals);
                return;
            }
            const appeals = yield appealService.getCompletedAppeals();
            res.json(appeals);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    // Создание новой заявки
    router.post("/", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("client"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { mechanism, problem, fioClient, priority } = req.body;
            const appeal = yield appealService.createAppeal(mechanism, problem, fioClient, req.currentUser.id, priority);
            res.status(201).json(appeal);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    // Взятие заявки в работу
    router.patch("/:id/take", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("staff"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const appealId = parseInt(req.params.id);
            const appeal = yield appealService.takeAppealToWork(appealId, req.currentUser.id);
            res.json(appeal);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    // Закрытие заявки
    router.patch("/:id/close", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("staff"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const appealId = parseInt(req.params.id);
            const { description, fio_staff } = req.body;
            const appeal = yield appealService.closeAppeal(appealId, req.currentUser.id, description, fio_staff);
            res.json(appeal);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.log(error);
            res.status(400).json({ error: message });
        }
    }));
    // Отмена заявки
    router.patch("/:id/cancel", current_user_1.currentUser, require_auth_1.requireAuth, (0, require_role_1.requireRole)("client"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const appealId = parseInt(req.params.id);
            // 1. Извлекаем имя инициатора из тела запроса
            const { cancel_initiator } = req.body;
            // 2. (Опционально) Простая проверка на наличие данных
            if (!cancel_initiator) {
                res
                    .status(400)
                    .json({ error: "Необходимо указать инициатора отмены" });
                return;
            }
            // 3. Передаем имя инициатора в сервис третьим аргументом
            const appeal = yield appealService.cancelAppeal(appealId, req.currentUser.id, cancel_initiator);
            res.json(appeal);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    return router;
};
exports.appealRouter = appealRouter;
