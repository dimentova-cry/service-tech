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
exports.StaffService = void 0;
const StaffRepository_1 = require("../repositories/StaffRepository");
const RoleRepository_1 = require("../repositories/RoleRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const typeorm_1 = require("typeorm");
const AppealRepository_1 = require("../repositories/AppealRepository");
const ClientRepository_1 = require("../repositories/ClientRepository");
/**
 * Сервис для работы с сотрудниками (Staff)
 */
class StaffService {
    constructor(dataSource) {
        // Инициализация репозиториев
        this.staffRepo = new StaffRepository_1.StaffRepository(dataSource);
        this.roleRepo = new RoleRepository_1.RoleRepository(dataSource);
        this.appealRepo = new AppealRepository_1.AppealRepository(dataSource);
        this.clientRepo = new ClientRepository_1.ClientRepository(dataSource);
    }
    assignedClientsView(clients) {
        return (clients !== null && clients !== void 0 ? clients : []).map((client) => ({
            id: client.id,
            company_name: client.company_name,
        }));
    }
    /**
     * Создание нового сотрудника
     * @param login Логин сотрудника
     * @param plainPassword Пароль в открытом виде
     * @param fio ФИО сотрудника
     * @returns Созданный сотрудник
     * @throws Ошибка если сотрудник уже существует или роль не найдена
     */
    createStaff(login, plainPassword, fio, phone_number_staff, email) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка уникальности логина
            const exists = yield this.staffRepo.findByLogin(login);
            if (exists)
                throw new Error("Сотрудник с таким логином уже существует");
            // Получение роли "staff"
            const role = yield this.roleRepo.findByRoleName("staff");
            if (!role)
                throw new Error("Роль сотрудника не найдена");
            // Хеширование пароля
            const password = yield bcrypt_1.default.hash(plainPassword, 10);
            // Создание сотрудника
            return this.staffRepo.createStaff(login, password, plainPassword, fio, role, phone_number_staff, email);
        });
    }
    /**
     * Получение заявок сотрудника
     * @param staffId ID сотрудника
     * @returns Сотрудник с связанными заявками
     */
    getStaffAppeals(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.staffRepo.findOne({
                where: { id: staffId },
                relations: ["opened_appeals", "closed_appeals"], // Загружаем открытые и закрытые заявки
            });
        });
    }
    /**
     * Удаление сотрудника
     * @param staffId ID сотрудника
     * @throws Ошибка если сотрудник не найден
     */
    removeStaff(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.appealRepo.update({ fio_staff_close_id: { id: staffId } }, { fio_staff_close_id: null });
            yield this.appealRepo.update({ fio_staff_open_id: { id: staffId } }, { fio_staff_open_id: null });
            return this.staffRepo.removeStaff(staffId);
        });
    }
    /**
     * Редактирование данных сотрудника
     * @param staffId ID сотрудника
     * @param fio Новое ФИО (опционально)
     * @param login Новый логин (опционально)
     * @param password Новый пароль (опционально)
     * @returns Обновленный сотрудник
     * @throws Ошибка если сотрудник не найден
     */
    editStaff(staffId, fio, login, password, phone_number_staff, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield this.staffRepo.findByIdWithRole(staffId);
            if (!staff)
                throw new Error("staff не найден");
            let passwordHash;
            if (password) {
                passwordHash = yield bcrypt_1.default.hash(password, 10);
            }
            return this.staffRepo.editStaff(staffId, fio, login, passwordHash, password, phone_number_staff, email);
        });
    }
    /**
     * Получение всех сотрудников
     * @returns Массив сотрудников с загруженными ролями
     */
    getAllStaff() {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield this.staffRepo.find({
                relations: ["role", "assigned_clients"],
            });
            return staff.map((member) => (Object.assign(Object.assign({}, member), { assigned_clients: this.assignedClientsView(member.assigned_clients) })));
        });
    }
    /**
     * Заменяет набор заказчиков, заявки которых доступны сотруднику
     */
    setAssignedClients(staffId, clientIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield this.staffRepo.findOne({
                where: { id: staffId },
                relations: ["assigned_clients", "role"],
            });
            if (!staff)
                throw new Error("Сотрудник не найден");
            const uniqueIds = [...new Set(clientIds)];
            if (uniqueIds.length === 0) {
                staff.assigned_clients = [];
            }
            else {
                const clients = yield this.clientRepo.findBy({ id: (0, typeorm_1.In)(uniqueIds) });
                if (clients.length !== uniqueIds.length) {
                    throw new Error("Заказчик не найден");
                }
                staff.assigned_clients = clients;
            }
            const saved = yield this.staffRepo.save(staff);
            return Object.assign(Object.assign({}, saved), { assigned_clients: this.assignedClientsView(saved.assigned_clients) });
        });
    }
    /**
     * Поиск сотрудника по ID
     * @param staffId ID сотрудника
     * @returns Найденный сотрудник или null
     */
    findById(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.staffRepo.findOne({
                where: { id: staffId },
                relations: ["role"],
            });
        });
    }
    /**
     * Обновление пароля сотрудника
     * @param staffId ID сотрудника
     * @param newPassword Новый пароль
     * @throws Ошибка если сотрудник не найден
     */
    updatePassword(staffId, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = yield this.findById(staffId);
            if (!staff)
                throw new Error("Сотрудник не найден");
            const passwordHash = yield bcrypt_1.default.hash(newPassword, 10);
            return this.staffRepo.editStaff(staffId, undefined, undefined, passwordHash);
        });
    }
}
exports.StaffService = StaffService;
