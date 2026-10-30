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
exports.AppealRepository = void 0;
const typeorm_1 = require("typeorm");
const Appeal_1 = require("../entities/Appeal");
const AppealStatus_1 = require("../entities/AppealStatus");
// Кастомный репозиторий для работы с обращениями (Appeal)
class AppealRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        // Инициализация родительского класса Repository для сущности Appeal
        super(Appeal_1.Appeal, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    // Поиск всех новых обращений
    findNewAppeals() {
        return __awaiter(this, void 0, void 0, function* () {
            // Сначала находим статус "new"
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "new" },
            });
            if (!status)
                return []; // Если статус не найден, возвращаем пустой массив
            // Ищем все обращения с этим статусом
            return this.find({
                where: { status: { id: status.id } },
                relations: ["company_name_id", "status"], // Загружаем связанные сущности
            });
        });
    }
    // Поиск новых обращений конкретного клиента
    findNewAppealsByClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "new" },
            });
            if (!status)
                return [];
            return this.find({
                where: {
                    status: { id: status.id },
                    company_name_id: { id: clientId }, // Фильтр по ID клиента
                },
                relations: ["company_name_id", "status"],
            });
        });
    }
    findNewAppealsByClientIds(clientIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (clientIds.length === 0)
                return [];
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "new" },
            });
            if (!status)
                return [];
            return this.find({
                where: {
                    status: { id: status.id },
                    company_name_id: { id: (0, typeorm_1.In)(clientIds) },
                },
                relations: ["company_name_id", "status"],
            });
        });
    }
    // Поиск обращений в работе
    findAppealsInProgress() {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "in_progress" },
            });
            if (!status)
                return [];
            return this.find({
                where: { status: { id: status.id } },
                relations: ["company_name_id", "fio_staff_open_id"], // Загружаем сотрудника, который открыл обращение
            });
        });
    }
    // Поиск обращений в работе для конкретного клиента
    getAppealsInProgressByClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "in_progress" },
            });
            if (!status)
                return [];
            return this.find({
                where: {
                    status: { id: status.id },
                    company_name_id: { id: clientId },
                },
                relations: ["company_name_id", "status", "fio_staff_open_id"],
            });
        });
    }
    findAppealsInProgressByClientIds(clientIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (clientIds.length === 0)
                return [];
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "in_progress" },
            });
            if (!status)
                return [];
            return this.find({
                where: {
                    status: { id: status.id },
                    company_name_id: { id: (0, typeorm_1.In)(clientIds) },
                },
                relations: ["company_name_id", "status", "fio_staff_open_id"],
            });
        });
    }
    // Поиск завершенных обращений
    findCompletedAppeals() {
        return __awaiter(this, void 0, void 0, function* () {
            const statuses = yield this.manager.find(AppealStatus_1.AppealStatus, {
                where: [
                    { st: "completed" },
                    { st: "cancel" }, // Добавляем статус отмены
                ],
            });
            if (statuses.length === 0)
                return [];
            const statusIds = statuses.map((s) => s.id);
            return this.find({
                where: {
                    status: {
                        id: (0, typeorm_1.In)(statusIds), // Используем оператор In для фильтрации по нескольким ID
                    },
                },
                relations: ["company_name_id", "fio_staff_close_id", "fio_staff_open_id"],
                order: {
                    date_close: "DESC", // Рекомендую добавить сортировку по дате закрытия (новые сверху)
                },
            });
        });
    }
    findCompletedAppealsByClientIds(clientIds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (clientIds.length === 0)
                return [];
            const statuses = yield this.manager.find(AppealStatus_1.AppealStatus, {
                where: [{ st: "completed" }, { st: "cancel" }],
            });
            if (statuses.length === 0)
                return [];
            return this.find({
                where: {
                    status: { id: (0, typeorm_1.In)(statuses.map((s) => s.id)) },
                    company_name_id: { id: (0, typeorm_1.In)(clientIds) },
                },
                relations: [
                    "company_name_id",
                    "fio_staff_close_id",
                    "fio_staff_open_id",
                ],
                order: { date_close: "DESC" },
            });
        });
    }
    // Поиск завершенных обращений для конкретного клиента
    getCompletedAppealsByClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            const statuses = yield this.manager.find(AppealStatus_1.AppealStatus, {
                where: [
                    { st: "completed" },
                    { st: "cancel" }, // Добавляем статус отмены
                ],
            });
            if (statuses.length === 0)
                return [];
            const statusIds = statuses.map((s) => s.id);
            return this.find({
                where: {
                    status: (0, typeorm_1.In)(statusIds),
                    company_name_id: { id: clientId },
                },
                relations: [
                    "company_name_id",
                    "status",
                    "fio_staff_open_id",
                    "fio_staff_close_id",
                ],
            });
        });
    }
    // Создание нового обращения
    createAppeal(priority, mechanism, // Тип механизма
    problem, // Описание проблемы
    fioClient, // ФИО клиента
    status, // Статус обращения
    client, // Клиент
    staff) {
        return __awaiter(this, void 0, void 0, function* () {
            // Создаем новый экземпляр обращения
            const appeal = this.create({
                priority: priority || "Средний",
                mechanism,
                problem,
                fio_client: fioClient,
                status,
                company_name_id: client, // Связь с клиентом
                fio_staff_open_id: staff, // Связь с сотрудником (если указан)
                date_start: new Date(), // Устанавливаем текущую дату
            });
            return this.save(appeal); // Сохраняем в БД
        });
    }
    // Закрытие обращения
    closeAppeal(id, // ID обращения
    staff, // Сотрудник, закрывающий обращение
    description, // Описание решения
    fio_staff) {
        return __awaiter(this, void 0, void 0, function* () {
            // Находим обращение по ID
            const appeal = yield this.findOne({
                where: { id },
                relations: ["status", "company_name_id"],
            });
            if (!appeal)
                throw new Error("Appeal not found");
            // Находим статус "completed"
            const status = yield this.manager.findOne(AppealStatus_1.AppealStatus, {
                where: { st: "completed" },
            });
            if (!status)
                throw new Error("Status not found");
            // Обновляем данные обращения
            appeal.status = status;
            appeal.fio_staff_close_id = staff; // Устанавливаем сотрудника, закрывшего обращение
            appeal.fio_staff = fio_staff;
            appeal.date_close = new Date(); // Устанавливаем текущую дату как дату закрытия
            appeal.appeal_desc = description; // Добавляем описание решения
            return this.save(appeal); // Сохраняем изменения
        });
    }
}
exports.AppealRepository = AppealRepository;
