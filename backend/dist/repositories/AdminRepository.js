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
exports.AdminRepository = void 0;
const typeorm_1 = require("typeorm");
const Admin_1 = require("../entities/Admin");
// Кастомный репозиторий для работы с администраторами
class AdminRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        // Инициализация родительского класса Repository
        super(Admin_1.Admin, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    // Поиск администратора по логину (с загрузкой роли)
    findByLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { login_admin: login },
                relations: ["role"], // Загружаем связанную сущность Role
            });
        });
    }
    // Поиск администратора по ID (с загрузкой роли)
    findByIdWithRole(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { id },
                relations: ["role"],
            });
        });
    }
    // Создание нового администратора
    createAdmin(login, password, plainPassword, fio, phone, role) {
        return __awaiter(this, void 0, void 0, function* () {
            // Создаем новый экземпляр администратора
            const admin = this.create({
                login_admin: login,
                password,
                password_plain: plainPassword,
                fio_admin: fio,
                phone_number_admin: phone,
                role, // Связь с сущностью Role
            });
            // Сохраняем в базе данных
            return this.save(admin);
        });
    }
    // Поиск администратора по номеру телефона
    getAdminByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { phone_number_admin: phone },
                relations: ["role"],
            });
        });
    }
    // Получение первого администратора из базы
    getOneAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: {}, // Без условий
                relations: ["role"],
                order: { id: "ASC" }, // Сортировка по ID (первый)
            });
        });
    }
}
exports.AdminRepository = AdminRepository;
