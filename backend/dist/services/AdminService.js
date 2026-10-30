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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const AdminRepository_1 = require("../repositories/AdminRepository");
const RoleRepository_1 = require("../repositories/RoleRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * Сервис для работы с администраторами
 */
class AdminService {
    constructor(dataSource) {
        this.adminRepo = new AdminRepository_1.AdminRepository(dataSource);
        this.roleRepo = new RoleRepository_1.RoleRepository(dataSource);
    }
    /**
     * Создание нового администратора
     * @param login Логин администратора
     * @param plainPassword Пароль в открытом виде
     * @param fio ФИО администратора
     * @param phone Номер телефона
     * @returns Созданный администратор
     * @throws Ошибка если администратор уже существует или роль не найдена
     */
    createAdmin(login, plainPassword, fio, phone) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка существования администратора
            const exists = yield this.adminRepo.findByLogin(login);
            if (exists)
                throw new Error("Администратор уже существует");
            // Получение роли администратора
            const role = yield this.roleRepo.findByRoleName("admin");
            if (!role)
                throw new Error("Роль администратора не найдена");
            // Хеширование пароля
            const password = yield bcrypt_1.default.hash(plainPassword, 10);
            // Создание администратора
            return this.adminRepo.createAdmin(login, password, plainPassword, fio, phone, role);
        });
    }
    /**
     * Обновление учетных данных администратора
     * @param adminId ID администратора
     * @param newLogin Новый логин (опционально)
     * @param newPassword Новый пароль (опционально)
     * @param newPhone Новый телефон (опционально)
     * @returns Обновленный администратор
     * @throws Ошибка если администратор не найден
     */
    updateAdminCredentials(adminId, newLogin, newPassword, newPhone, newEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            // Поиск администратора
            const admin = yield this.adminRepo.findOne({ where: { id: adminId } });
            if (!admin)
                throw new Error("Администратор не найден");
            // Установка новых значений или сохранение старых
            if (!newLogin)
                newLogin = admin.login_admin;
            if (!newPassword)
                newPassword = admin.password_plain;
            if (!newPhone)
                newPhone = admin.phone_number_admin;
            if (!newEmail)
                newEmail = admin.email;
            // Обновление полей
            admin.login_admin = newLogin;
            admin.password = yield bcrypt_1.default.hash(newPassword, 10);
            admin.password_plain = newPassword;
            admin.phone_number_admin = newPhone;
            admin.email = newEmail;
            // Сохранение изменений
            return this.adminRepo.save(admin);
        });
    }
    /**
     * Получение почты администратора
     * @returns Почта администратора
     */
    getAdminEmail() {
        return __awaiter(this, void 0, void 0, function* () {
            const admin = yield this.adminRepo.getOneAdmin();
            if (!admin)
                throw new Error("Администратор не найден");
            return admin.email;
        });
    }
}
exports.AdminService = AdminService;
