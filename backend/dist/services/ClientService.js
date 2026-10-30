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
exports.ClientService = void 0;
const ClientRepository_1 = require("../repositories/ClientRepository");
const RoleRepository_1 = require("../repositories/RoleRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppealRepository_1 = require("../repositories/AppealRepository");
/**
 * Сервис для работы с клиентами
 */
class ClientService {
    constructor(dataSource, telegramService) {
        this.clientRepo = new ClientRepository_1.ClientRepository(dataSource);
        this.roleRepo = new RoleRepository_1.RoleRepository(dataSource);
        this.telegramService = telegramService;
        this.appealRepo = new AppealRepository_1.AppealRepository(dataSource);
    }
    /**
     * Отправка уведомления клиенту через Telegram
     */
    sendTelegramNotification(phone, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.telegramService.sendMessageToClient(phone, message);
        });
    }
    /**
     * Создание нового клиента
     */
    createClient(login, plainPassword, phone, companyName, email) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка уникальности логина
            const exists = yield this.clientRepo.findByLogin(login);
            if (exists)
                throw new Error("Клиент с таким логином уже существует");
            // Получение роли клиента
            const role = yield this.roleRepo.findByRoleName("client");
            if (!role)
                throw new Error("Роль клиента не найдена в базе данных");
            // Хеширование пароля
            const password = yield bcrypt_1.default.hash(plainPassword, 10);
            // Создание клиента
            return this.clientRepo.createClient(login, password, plainPassword, phone, companyName, role, email);
        });
    }
    /**
     * Получение клиента с его заявками
     */
    getClientWithAppeals(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.clientRepo.findByIdWithAppeals(clientId);
        });
    }
    /**
     * Получение всех клиентов с их заявками
     */
    getAllClients() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.clientRepo.getClientsWithAppeals();
        });
    }
    /**
     * Получение клиента по ID
     */
    getClientById(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.clientRepo.findByIdWithRole(clientId);
        });
    }
    /**
     * Получение клиента по логину
     */
    getClientByLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.clientRepo.findByLogin(login);
        });
    }
    /**
     * Получение клиента по телефону
     */
    getClientByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.clientRepo.getClientByPhone(phone);
        });
    }
    /**
     * Обновление данных клиента
     */
    updateClient(clientId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка существования клиента
            const client = yield this.clientRepo.findByIdWithRole(clientId);
            if (!client)
                throw new Error("Клиент не найден");
            const updatePayload = {};
            // Обновление названия компании
            if (updateData.companyName)
                updatePayload.companyName = updateData.companyName;
            // Обновление телефона
            if (updateData.phone)
                updatePayload.phone = updateData.phone;
            // Обновление логина с проверкой уникальности
            if (updateData.login) {
                const loginExists = yield this.clientRepo.findByLogin(updateData.login);
                if (loginExists && loginExists.id !== clientId) {
                    throw new Error("Этот логин уже используется другим клиентом");
                }
                updatePayload.login = updateData.login;
            }
            // Обновление пароля
            if (updateData.plainPassword) {
                const passwordHash = yield bcrypt_1.default.hash(updateData.plainPassword, 10);
                updatePayload.passwordHash = passwordHash;
                updatePayload.plainPassword = updateData.plainPassword;
            }
            if (updateData.email)
                updatePayload.email = updateData.email;
            console.log("updatePayload check", updatePayload);
            // Сохранение изменений
            yield this.clientRepo.editClient(clientId, updatePayload);
        });
    }
    /**
     * Обновление пароля клиента
     */
    updateClientPassword(clientId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка существования клиента
            const client = yield this.clientRepo.findByIdWithRole(clientId);
            if (!client)
                throw new Error("Клиент не найден");
            // Проверка текущего пароля
            const isPasswordValid = yield bcrypt_1.default.compare(currentPassword, client.password_hash);
            if (!isPasswordValid)
                throw new Error("Текущий пароль неверен");
            // Хеширование нового пароля
            const newPasswordHash = yield bcrypt_1.default.hash(newPassword, 10);
            // Обновление пароля
            yield this.clientRepo.updateClientPassword(clientId, newPasswordHash, newPassword);
        });
    }
    /**
     * Удаление клиента
     */
    deleteClient(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка существования клиента
            const client = yield this.clientRepo.findByIdWithRole(clientId);
            if (!client)
                throw new Error("Клиент не найден");
            // Сначала удаляем все связанные обращения
            yield this.appealRepo.delete({
                company_name_id: { id: clientId },
            });
            // Удаление клиента
            yield this.clientRepo.removeClient(clientId);
        });
    }
    /**
     * Проверка учетных данных клиента
     */
    validateClientCredentials(login, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.clientRepo.findByLogin(login);
            if (!client)
                return null;
            // Проверка пароля
            const isValid = yield bcrypt_1.default.compare(password, client.password_hash);
            return isValid ? client : null;
        });
    }
}
exports.ClientService = ClientService;
