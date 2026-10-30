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
exports.RoleRepository = void 0;
const typeorm_1 = require("typeorm");
const Role_1 = require("../entities/Role");
/**
 * Репозиторий для работы с ролями пользователей
 */
class RoleRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        // Инициализация родительского класса Repository для сущности Role
        super(Role_1.Role, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    /**
     * Поиск роли по названию
     * @param role Название роли (например, 'admin', 'client', 'manager')
     * @returns Найденная роль или null если не существует
     */
    findByRoleName(role) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({
                where: { role },
            });
        });
    }
    /**
     * Создание новой роли
     * @param roleName Название новой роли
     * @returns Созданная роль
     * @throws Ошибка если роль уже существует
     */
    createRole(roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверяем существует ли роль
            const existingRole = yield this.findByRoleName(roleName);
            if (existingRole) {
                throw new Error(`Role '${roleName}' already exists`);
            }
            // Создаем и сохраняем новую роль
            const role = this.create({
                role: roleName,
            });
            return this.save(role);
        });
    }
    /**
     * Получение всех ролей
     * @returns Массив всех ролей
     */
    getAllRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.find();
        });
    }
    /**
     * Удаление роли по названию
     * @param roleName Название роли для удаления
     * @returns Количество удаленных записей
     */
    deleteRole(roleName) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.delete({ role: roleName });
            return result.affected || 0;
        });
    }
}
exports.RoleRepository = RoleRepository;
