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
exports.AppealStatusRepository = void 0;
const typeorm_1 = require("typeorm");
const AppealStatus_1 = require("../entities/AppealStatus");
// Кастомный репозиторий для работы со статусами обращений
class AppealStatusRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        // Инициализация родительского класса Repository для сущности AppealStatus
        super(AppealStatus_1.AppealStatus, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    /**
     * Поиск статуса обращения по названию
     * @param st Название статуса (например, 'new', 'in_progress', 'completed')
     * @returns Найденный статус или null если не найден
     */
    findByStatusName(st) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({ where: { st } });
        });
    }
    /**
     * Получение всех статусов обращений
     * @returns Массив всех статусов
     */
    getAllStatuses() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.find();
        });
    }
}
exports.AppealStatusRepository = AppealStatusRepository;
