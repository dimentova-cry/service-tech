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
exports.ClientRepository = void 0;
const typeorm_1 = require("typeorm");
const Client_1 = require("../entities/Client");
// Кастомный репозиторий для работы с клиентами
class ClientRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        // Инициализация родительского класса Repository для сущности Client
        super(Client_1.Client, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    /**
     * Поиск клиента по логину
     * @param login Логин клиента
     * @returns Клиент с загруженной ролью или null если не найден
     */
    findByLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { login_client: login },
                relations: ["role"], // Загружаем связанную сущность Role
            });
        });
    }
    /**
     * Поиск клиента по ID с загрузкой роли
     * @param id ID клиента
     * @returns Клиент с ролью или null
     */
    findByIdWithRole(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { id },
                relations: ["role"],
            });
        });
    }
    /**
     * Создание нового клиента
     * @param login Логин
     * @param passwordHash Хэш пароля
     * @param plainPassword Пароль в открытом виде (не рекомендуется)
     * @param phone Номер телефона
     * @param companyName Название компании
     * @param role Роль клиента
     * @returns Созданный клиент
     */
    createClient(login, passwordHash, plainPassword, phone, companyName, role, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = this.create({
                login_client: login,
                password_hash: passwordHash,
                password_plain: plainPassword,
                phone_number_client: phone,
                company_name: companyName,
                role, // Связь с сущностью Role
                email,
            });
            return this.save(client);
        });
    }
    /**
     * Получение всех клиентов с их обращениями
     * @returns Массив клиентов с загруженными обращениями и ролями
     */
    getClientsWithAppeals() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.find({
                relations: ["appeals", "role"], // Загружаем обращения и роль
                order: { company_name: "ASC" }, // Сортировка по названию компании
            });
        });
    }
    /**
     * Удаление клиента
     * @param clientId ID клиента для удаления
     */
    removeClient(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delete(clientId);
        });
    }
    /**
     * Редактирование данных клиента
     * @param clientId ID клиента
     * @param data Объект с изменяемыми полями
     */
    editClient(clientId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedData = {};
            // Формируем объект для обновления только переданных полей
            if (data.companyName)
                updatedData["company_name"] = data.companyName;
            if (data.login)
                updatedData["login_client"] = data.login;
            if (data.passwordHash)
                updatedData["password_hash"] = data.passwordHash;
            if (data.plainPassword)
                updatedData["password_plain"] = data.plainPassword;
            if (data.phone)
                updatedData["phone_number_client"] = data.phone;
            if (data.email)
                updatedData["email"] = data.email;
            yield this.update(clientId, updatedData);
        });
    }
    /**
     * Поиск клиента по ID с загрузкой обращений
     * @param clientId ID клиента
     * @returns Клиент с обращениями и ролью или null
     */
    findByIdWithAppeals(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { id: clientId },
                relations: ["appeals", "role"],
            });
        });
    }
    /**
     * Поиск клиента по номеру телефона
     * @param phone Номер телефона
     * @returns Найденный клиент или null
     */
    getClientByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { phone_number_client: phone },
            });
        });
    }
    /**
     * Обновление пароля клиента
     * @param clientId ID клиента
     * @param newPasswordHash Новый хэш пароля
     * @param newPlainPassword Новый пароль в открытом виде
     */
    updateClientPassword(clientId, newPasswordHash, newPlainPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.update(clientId, {
                password_hash: newPasswordHash,
                password_plain: newPlainPassword,
            });
        });
    }
}
exports.ClientRepository = ClientRepository;
