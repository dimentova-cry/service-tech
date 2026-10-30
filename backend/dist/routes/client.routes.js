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
exports.clientRouter = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const require_auth_1 = require("../middlewares/require-auth");
const require_role_1 = require("../middlewares/require-role");
// Роутер для работы с клиентами
const clientRouter = (clientService) => {
    const router = (0, express_1.Router)();
    // Применение middleware для проверки аутентификации
    router.use((req, res, next) => {
        (0, current_user_1.currentUser)(req, res, (err) => {
            if (err)
                return next(err);
            (0, require_auth_1.requireAuth)(req, res, next);
        });
    });
    // Создание клиента (только админы)
    router.post("/", (0, require_role_1.requireRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { login, password, phone, companyName, email } = req.body;
            const client = yield clientService.createClient(login, password, phone, companyName, email);
            res.status(201).json(client);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    // Получение всех клиентов (только админы)
    router.get("/", (0, require_role_1.requireRole)("admin"), (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const clients = yield clientService.getAllClients();
            res.json(clients);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(500).json({ error: message });
        }
    }));
    // Получение клиента по ID
    router.get("/:id", (0, require_role_1.requireRole)("admin", "client"), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const clientId = req.params.id === "me"
                ? req.currentUser.id
                : parseInt(req.params.id);
            // Проверка прав доступа
            if (req.currentUser.role === "client" &&
                clientId !== req.currentUser.id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            const client = yield clientService.getClientById(clientId);
            if (!client) {
                res.status(404).json({ error: "Client not found" });
                return;
            }
            res.json(client);
        }
        catch (error) {
            next(error);
        }
    }));
    // Получение заявок клиента
    router.get("/:id/appeals", (0, require_role_1.requireRole)("admin", "client"), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const clientId = req.params.id === "me"
                ? req.currentUser.id
                : parseInt(req.params.id);
            // Проверка прав доступа
            if (req.currentUser.role === "client" &&
                clientId !== req.currentUser.id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            const client = yield clientService.getClientWithAppeals(clientId);
            res.json((client === null || client === void 0 ? void 0 : client.appeals) || []);
        }
        catch (error) {
            next(error);
        }
    }));
    // Обновление данных клиента
    router.put("/:id", (0, require_role_1.requireRole)("admin", "client"), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const clientId = req.params.id === "me"
                ? req.currentUser.id
                : parseInt(req.params.id);
            // Проверка прав доступа
            if (req.currentUser.role === "client" &&
                clientId !== req.currentUser.id) {
                res.status(403).json({ error: "Forbidden" });
                return;
            }
            const { login, phone, companyName, currentPassword, newPassword, email, } = req.body;
            console.log("email check", email);
            // Обновление данных
            if (login || phone || companyName || email) {
                yield clientService.updateClient(clientId, {
                    login,
                    phone,
                    companyName,
                    email,
                });
            }
            // Обновление пароля
            if (currentPassword && newPassword) {
                yield clientService.updateClientPassword(clientId, currentPassword, newPassword);
            }
            const updatedClient = yield clientService.getClientById(clientId);
            res.json(updatedClient);
        }
        catch (error) {
            next(error);
        }
    }));
    // Удаление клиента (только админы)
    router.delete("/:id", (0, require_role_1.requireRole)("admin"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const clientId = parseInt(req.params.id);
            yield clientService.deleteClient(clientId);
            res.status(204).send();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            res.status(400).json({ error: message });
        }
    }));
    return router;
};
exports.clientRouter = clientRouter;
