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
exports.staffRouter = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const require_auth_1 = require("../middlewares/require-auth");
const require_role_1 = require("../middlewares/require-role");
// Роутер для работы с сотрудниками
const staffRouter = (staffService) => {
    const router = (0, express_1.Router)();
    // Применение middleware для проверки прав доступа
    router.use((req, res, next) => {
        (0, current_user_1.currentUser)(req, res, (err) => {
            if (err)
                return next(err);
            (0, require_auth_1.requireAuth)(req, res, (err) => {
                if (err)
                    return next(err);
                (0, require_role_1.requireRole)("admin")(req, res, next);
            });
        });
    });
    // Создание нового сотрудника
    router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { login, password, fio, phone_number_staff, email } = req.body;
            const staff = yield staffService.createStaff(login, password, fio, phone_number_staff, email);
            res.status(201).json(staff);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Ошибка создания сотрудника";
            res.status(400).json({ error: message });
        }
    }));
    // Получение заявок сотрудника
    router.get("/:id/appeals", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const staffId = parseInt(req.params.id);
            if (isNaN(staffId)) {
                res.status(400).json({ error: "Некорректный ID сотрудника" });
                return;
            }
            const appeals = yield staffService.getStaffAppeals(staffId);
            res.json(appeals);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Ошибка получения заявок сотрудника";
            res.status(400).json({ error: message });
        }
    }));
    router.put("/:id/clients", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const staffId = parseInt(req.params.id);
            const { clientIds } = req.body;
            if (isNaN(staffId) ||
                !Array.isArray(clientIds) ||
                clientIds.some((id) => !Number.isInteger(id))) {
                res.status(400).json({ error: "Некорректный список заказчиков" });
                return;
            }
            const staff = yield staffService.setAssignedClients(staffId, clientIds);
            res.json(staff);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Ошибка сохранения привязок заказчиков";
            res.status(400).json({ error: message });
        }
    }));
    // Обновление данных сотрудника
    router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const staffId = parseInt(req.params.id);
            if (isNaN(staffId)) {
                res.status(400).json({ error: "Некорректный ID сотрудника" });
                return;
            }
            const { login, password, fio, phone_number_staff, email } = req.body;
            const staff = yield staffService.editStaff(staffId, fio, login, password, phone_number_staff, email);
            res.json(staff);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Ошибка обновления данных сотрудника";
            res.status(400).json({ error: message });
        }
    }));
    // Удаление сотрудника
    router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const staffId = parseInt(req.params.id);
            if (isNaN(staffId)) {
                res.status(400).json({ error: "Некорректный ID сотрудника" });
                return;
            }
            yield staffService.removeStaff(staffId);
            res.sendStatus(204);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Ошибка удаления сотрудника";
            res.status(400).json({ error: message });
        }
    }));
    // Получение списка всех сотрудников
    router.get("/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const staff = yield staffService.getAllStaff();
            res.json(staff);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Ошибка получения списка сотрудников";
            res.status(400).json({ error: message });
        }
    }));
    return router;
};
exports.staffRouter = staffRouter;
