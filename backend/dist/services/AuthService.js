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
exports.AuthService = void 0;
const AdminRepository_1 = require("../repositories/AdminRepository");
const ClientRepository_1 = require("../repositories/ClientRepository");
const StaffRepository_1 = require("../repositories/StaffRepository");
const RoleRepository_1 = require("../repositories/RoleRepository");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Сервис для аутентификации и авторизации пользователей
 */
class AuthService {
    constructor(dataSource) {
        // Инициализация репозиториев для работы с разными типами пользователей
        this.adminRepo = new AdminRepository_1.AdminRepository(dataSource);
        this.clientRepo = new ClientRepository_1.ClientRepository(dataSource);
        this.staffRepo = new StaffRepository_1.StaffRepository(dataSource);
        this.roleRepo = new RoleRepository_1.RoleRepository(dataSource);
    }
    /**
     * Обновление токена доступа
     * @param id - ID пользователя
     * @param role - Роль пользователя (admin, staff, client)
     * @returns Объект с новым токеном и данными пользователя
     */
    refresh(_a) {
        return __awaiter(this, arguments, void 0, function* ({ id, role }) {
            // Проверка существования роли
            const roleObj = yield this.roleRepo.findByRoleName(role);
            if (!roleObj)
                throw new Error("Недопустимая роль");
            let user;
            // Получение пользователя в зависимости от роли
            switch (role) {
                case "admin":
                    user = yield this.adminRepo.findByIdWithRole(id);
                    break;
                case "staff":
                    user = yield this.staffRepo.findByIdWithRole(id);
                    break;
                case "client":
                    user = yield this.clientRepo.findByIdWithRole(id);
                    break;
                default:
                    throw new Error("Неизвестный тип пользователя");
            }
            // Генерация нового JWT токена
            return {
                token: jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET, {
                    expiresIn: "24h", // Токен действителен 24 часа
                }),
                user, // Возвращаем данные пользователя
            };
        });
    }
    /**
     * Аутентификация пользователя
     * @param login - Логин пользователя
     * @param password - Пароль пользователя
     * @param roleType - Тип пользователя (admin, staff, client)
     * @returns Объект с токеном и данными пользователя
     */
    login(login, password, roleType) {
        return __awaiter(this, void 0, void 0, function* () {
            let user;
            // Поиск пользователя в соответствующем репозитории
            switch (roleType) {
                case "admin":
                    user = yield this.adminRepo.findByLogin(login);
                    break;
                case "staff":
                    user = yield this.staffRepo.findByLogin(login);
                    break;
                case "client":
                    user = yield this.clientRepo.findByLogin(login);
                    break;
            }
            if (!user)
                throw new Error("Пользователь не найден");
            // Временная проверка пароля
            if (user.password_plain !== password)
                throw new Error("Неверный пароль");
            // Проверка соответствия роли пользователя
            const role = yield this.roleRepo.findByRoleName(roleType);
            if (!role || user.role.role !== roleType)
                throw new Error("Неверная роль");
            // Генерация JWT токена
            return {
                token: jsonwebtoken_1.default.sign({ id: user.id, role: roleType }, // Полезная нагрузка токена
                process.env.JWT_SECRET, // Секретный ключ из .env
                {
                    expiresIn: "24h", // Время жизни токена
                }),
                user, // Данные пользователя
            };
        });
    }
}
exports.AuthService = AuthService;
