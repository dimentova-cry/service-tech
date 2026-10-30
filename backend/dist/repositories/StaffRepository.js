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
exports.StaffRepository = void 0;
const typeorm_1 = require("typeorm");
const Staff_1 = require("../entities/Staff");
class StaffRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(Staff_1.Staff, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    // Поиск сотрудника по логину с загрузкой роли
    findByLogin(login) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({ where: { login_staff: login }, relations: ["role"] });
        });
    }
    // Поиск сотрудника по ID с загрузкой роли
    findByIdWithRole(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({ where: { id }, relations: ["role"] });
        });
    }
    // Создание нового сотрудника
    createStaff(login, password, plainPassword, fio, role, phone_number_staff, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const staff = this.create({
                login_staff: login,
                password,
                password_plain: plainPassword,
                fio_staff: fio,
                role,
                phone_number_staff,
                email,
            });
            return this.save(staff);
        });
    }
    // Получение всех сотрудников с их обращениями
    getStaffWithAppeals() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.find({
                relations: ["opened_appeals", "closed_appeals"],
            });
        });
    }
    // Удаление сотрудника по ID
    removeStaff(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.delete(staffId);
        });
    }
    // Редактирование данных сотрудника
    editStaff(staffId, fio, login, passwordHash, passwordPlain, phone_number_staff, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedData = {};
            if (fio)
                updatedData["fio_staff"] = fio;
            if (login)
                updatedData["login_staff"] = login;
            if (passwordHash)
                updatedData["password"] = passwordHash;
            if (passwordPlain)
                updatedData["password_plain"] = passwordPlain;
            if (phone_number_staff)
                updatedData["phone_number_staff"] = phone_number_staff;
            if (email)
                updatedData["email"] = email;
            yield this.update(staffId, updatedData);
        });
    }
    // Поиск администратора по номеру телефона
    getStaffByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { phone_number_staff: phone },
                relations: ["role"],
            });
        });
    }
}
exports.StaffRepository = StaffRepository;
