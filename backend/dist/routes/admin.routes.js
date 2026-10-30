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
exports.adminRouter = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const require_auth_1 = require("../middlewares/require-auth");
const require_role_1 = require("../middlewares/require-role");
const express_validator_1 = require("express-validator");
const validate_request_1 = require("../middlewares/validate-request");
const adminRouter = (adminService) => {
    const router = (0, express_1.Router)();
    // ✅ ПУБЛИЧНЫЙ РОУТ (без авторизации)
    router.get("/email", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const adminEmail = yield adminService.getAdminEmail();
            res.json({ email: adminEmail });
        }
        catch (error) {
            next(error);
        }
    }));
    // 🔒 ВСЁ НИЖЕ — ТОЛЬКО ДЛЯ ADMIN
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
    // Создание нового администратора
    router.post("/", [
        (0, express_validator_1.body)("login").trim().isLength({ min: 2, max: 10 }),
        (0, express_validator_1.body)("password").trim().isLength({ min: 2, max: 10 }),
        (0, express_validator_1.body)("fio").trim().notEmpty(),
        (0, express_validator_1.body)("phone").trim().isMobilePhone("any"),
    ], (req, res, next) => {
        (0, validate_request_1.validateRequest)(req, res, () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { login, password, fio, phone } = req.body;
                const admin = yield adminService.createAdmin(login, password, fio, phone);
                res.status(201).json(admin);
            }
            catch (error) {
                next(error);
            }
        }));
    });
    // Обновление учетных данных администратора
    router.put("/credentials", [
        (0, express_validator_1.body)("newLogin").trim().isLength({ min: 2, max: 10 }).optional(),
        (0, express_validator_1.body)("newPassword").trim().isLength({ min: 2, max: 10 }).optional(),
        (0, express_validator_1.body)("newPhone").trim().isLength({ min: 9, max: 13 }).optional(),
        (0, express_validator_1.body)("newEmail").isEmail().optional(),
    ], (req, res, next) => {
        (0, validate_request_1.validateRequest)(req, res, () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { newLogin, newPassword, newPhone, newEmail } = req.body;
                const admin = yield adminService.updateAdminCredentials(req.currentUser.id, newLogin, newPassword, newPhone, newEmail);
                res.json(admin);
            }
            catch (error) {
                next(error);
            }
        }));
    });
    return router;
};
exports.adminRouter = adminRouter;
