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
exports.AppealService = void 0;
const AppealRepository_1 = require("../repositories/AppealRepository");
const AppealStatusRepository_1 = require("../repositories/AppealStatusRepository");
const ClientRepository_1 = require("../repositories/ClientRepository");
const StaffRepository_1 = require("../repositories/StaffRepository");
const typeorm_1 = require("typeorm");
const excel_export_service_1 = require("./excel-export.service");
const AdminRepository_1 = require("../repositories/AdminRepository");
/**
 * Сервис для работы с заявками
 */
class AppealService {
    constructor(dataSource, telegramService) {
        this.telegramService = telegramService;
        // Инициализация репозиториев
        this.appealRepo = new AppealRepository_1.AppealRepository(dataSource);
        this.statusRepo = new AppealStatusRepository_1.AppealStatusRepository(dataSource);
        this.clientRepo = new ClientRepository_1.ClientRepository(dataSource);
        this.staffRepo = new StaffRepository_1.StaffRepository(dataSource);
        this.adminRepo = new AdminRepository_1.AdminRepository(dataSource);
        this.telegramService = telegramService;
    }
    /**
     * Создание новой заявки
     */
    createAppeal(mechanism, problem, fioClient, clientId, priority) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка существования клиента
            const client = yield this.clientRepo.findOne({ where: { id: clientId } });
            if (!client)
                throw new Error("Клиент не найден");
            // Получение статуса "Новая"
            const status = yield this.statusRepo.findByStatusName("new");
            if (!status)
                throw new Error("Статус не найден");
            // Создание заявки
            const appeal = yield this.appealRepo.createAppeal(priority, mechanism, problem, fioClient, status, client);
            // Уведомление администратора
            const admin = yield this.adminRepo.getOneAdmin();
            if (!admin)
                throw new Error("Администратор не найден");
            yield this.telegramService.sendMessageToAdmin(admin.phone_number_admin, `Назначено новое задание: Заявка №${appeal.id} от ${client.company_name}. Приоритет заявки: ${priority}.`);
            yield this.telegramService.sendMessageToAllStaff(`Назначено новое задание: Заявка №${appeal.id} от ${client.company_name}. Приоритет заявки: ${priority}.`);
            return appeal;
        });
    }
    /**
     * Взятие заявки в работу
     */
    staffCanAccessClient(staffId, clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!clientId)
                return false;
            const staff = yield this.staffRepo.findOne({
                where: { id: staffId },
                relations: ["assigned_clients"],
            });
            if (!staff)
                throw new Error("Сотрудник не найден");
            return ((_a = staff.assigned_clients) !== null && _a !== void 0 ? _a : []).some((client) => client.id === clientId);
        });
    }
    takeAppealToWork(appealId, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Проверка существования заявки
            const appeal = yield this.appealRepo.findOne({
                where: { id: appealId },
                relations: ["company_name_id"],
            });
            if (!appeal)
                throw new Error("Заявка не найдена");
            const canAccess = yield this.staffCanAccessClient(staffId, (_a = appeal.company_name_id) === null || _a === void 0 ? void 0 : _a.id);
            if (!canAccess)
                throw new Error("Нет доступа к заявкам этого заказчика");
            // Проверка существования сотрудника
            const staff = yield this.staffRepo.findOne({ where: { id: staffId } });
            if (!staff)
                throw new Error("Сотрудник не найден");
            // Получение статуса "В работе"
            const status = yield this.statusRepo.findByStatusName("in_progress");
            if (!status)
                throw new Error("Статус не найден");
            // Обновление заявки
            appeal.status = status;
            appeal.fio_staff_open_id = staff;
            appeal.fio_staff = staff.fio_staff;
            return this.appealRepo.save(appeal);
        });
    }
    /**
     * Закрытие заявки
     */
    closeAppeal(appealId, staffId, description, fio_staff) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const existing = yield this.appealRepo.findOne({
                where: { id: appealId },
                relations: ["company_name_id", "fio_staff_open_id"],
            });
            if (!existing)
                throw new Error("Заявка не найдена");
            const canAccess = yield this.staffCanAccessClient(staffId, (_a = existing.company_name_id) === null || _a === void 0 ? void 0 : _a.id);
            const isOpener = ((_b = existing.fio_staff_open_id) === null || _b === void 0 ? void 0 : _b.id) === staffId;
            if (!canAccess && !isOpener) {
                throw new Error("Нет доступа к заявкам этого заказчика");
            }
            // Проверка существования сотрудника
            const staff = yield this.staffRepo.findOne({ where: { id: staffId } });
            if (!staff)
                throw new Error("Сотрудник не найден");
            // Получение статуса "Завершено"
            const closedStatus = yield this.statusRepo.findByStatusName("completed");
            if (!closedStatus)
                throw new Error("Статус не найден");
            // Закрытие заявки
            const appeal = yield this.appealRepo.closeAppeal(appealId, staff, description, fio_staff);
            // Получение клиента для уведомления
            const client = yield this.clientRepo.findOne({
                where: { id: appeal.company_name_id.id },
                relations: ["appeals"],
            });
            if (!client)
                throw new Error("Клиент не найден");
            // Уведомление клиента
            yield this.telegramService.sendMessageToClient(client.phone_number_client, `Заявка №${appeal.id} от ${client.company_name} выполнена (закрыта)`);
            // Уведомление администратора
            const admin = yield this.adminRepo.getOneAdmin();
            if (!admin)
                throw new Error("Администратор не найден");
            yield this.telegramService.sendMessageToAdmin(admin.phone_number_admin, `Заявка №${appeal.id} от ${client.company_name} выполнена (закрыта)`);
            const statuses = yield this.statusRepo.find({
                where: [
                    { st: "completed" },
                    { st: "cancel" }, // Добавляем статус отмены
                ],
            });
            if (statuses.length === 0)
                return [];
            const statusIds = statuses.map((s) => s.id);
            // Генерация отчета
            if (appeal.company_name_id) {
                const appeals = yield this.appealRepo.find({
                    where: {
                        company_name_id: appeal.company_name_id,
                        status: (0, typeorm_1.In)(statusIds),
                    },
                    relations: [
                        "company_name_id",
                        "status",
                        "fio_staff_close_id",
                        "fio_staff_open_id",
                    ],
                });
                yield excel_export_service_1.excelExportService.getOrCreateReport(client, appeals);
            }
            return appeal;
        });
    }
    /**
     * Отмена заявки
     */
    cancelAppeal(appealId, userId, cancelInitiator) {
        return __awaiter(this, void 0, void 0, function* () {
            // Проверка существования пользователя
            const user = yield this.clientRepo.findOne({ where: { id: userId } });
            if (!user)
                throw new Error("Пользователь не найден");
            // Получение статусов
            const cancelStatus = yield this.statusRepo.findByStatusName("cancel");
            // const completedStatus = await this.statusRepo.findByStatusName("completed");
            // Поиск исходной заявки
            const prevAppeal = yield this.appealRepo.findOne({
                where: { id: appealId },
                relations: ["company_name_id", "fio_staff_close_id", "fio_staff_open_id"],
            });
            if (!prevAppeal)
                throw new Error("Заявка не найдена");
            // Создание заявки на отмену (системная запись об отмене)
            // Добавляем информацию об инициаторе в описание этой записи
            // const newAppeal = await this.appealRepo.createAppeal(
            //   "Отмена заявки",
            //   `Отмена заявки от ${prevAppeal.date_start.toLocaleString(
            //     "ru"
            //   )}. Инициатор: ${cancelInitiator}`,
            //   `Инициатор отмены со стороны заказчика: ${cancelInitiator}`,
            //   cancelStatus!,
            //   user
            // );
            // Обновление исходной заявки
            prevAppeal.status = cancelStatus;
            prevAppeal.date_close = new Date();
            // Формируем подробный комментарий в основной заявке
            prevAppeal.appeal_desc = `Заявка отменена заказчиком [${new Date().toISOString()}]. Инициатор отмены: ${cancelInitiator}`;
            yield this.appealRepo.save(prevAppeal);
            const statuses = yield this.statusRepo.find({
                where: [
                    { st: "completed" },
                    { st: "cancel" }, // Добавляем статус отмены
                ],
            });
            if (statuses.length === 0)
                return [];
            const statusIds = statuses.map((s) => s.id);
            console.log(statusIds, prevAppeal);
            const client = yield this.clientRepo.findOne({
                where: { id: prevAppeal.company_name_id.id },
                relations: ["appeals"],
            });
            if (!client)
                throw new Error("Клиент не найден");
            const admin = yield this.adminRepo.getOneAdmin();
            if (!admin)
                throw new Error("Администратор не найден");
            yield this.telegramService.sendMessageToAdmin(admin.phone_number_admin, `Заявка №${prevAppeal.id} от ${client.company_name} отменена заказчиком.`);
            yield this.telegramService.sendMessageToClient(client.phone_number_client, `Заявка №${prevAppeal.id} от ${client.company_name} отменена заказчиком.`);
            yield this.telegramService.sendMessageToAllStaff(`Заявка №${prevAppeal.id} от ${client.company_name} отменена заказчиком.`);
            if (prevAppeal.company_name_id) {
                const appeals = yield this.appealRepo.find({
                    where: {
                        company_name_id: prevAppeal.company_name_id,
                        status: (0, typeorm_1.In)(statusIds),
                    },
                    relations: [
                        "company_name_id",
                        "status",
                        "fio_staff_close_id",
                        "fio_staff_open_id",
                    ],
                });
                yield excel_export_service_1.excelExportService.getOrCreateReport(client, appeals);
            }
            return prevAppeal;
        });
    }
    // Методы получения заявок по статусам
    getNewAppeals() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findNewAppeals();
        });
    }
    getNewAppealsByClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findNewAppealsByClientId(clientId);
        });
    }
    getAppealsInProgress() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findAppealsInProgress();
        });
    }
    getAppealsInProgressByClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.getAppealsInProgressByClientId(clientId);
        });
    }
    getCompletedAppeals() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findCompletedAppeals();
        });
    }
    getCompletedAppealsByClientId(clientId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.getCompletedAppealsByClientId(clientId);
        });
    }
    assignedClientIds(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const staff = yield this.staffRepo.findOne({
                where: { id: staffId },
                relations: ["assigned_clients"],
            });
            if (!staff)
                throw new Error("Сотрудник не найден");
            return ((_a = staff.assigned_clients) !== null && _a !== void 0 ? _a : []).map((client) => client.id);
        });
    }
    getNewAppealsForStaff(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findNewAppealsByClientIds(yield this.assignedClientIds(staffId));
        });
    }
    getAppealsInProgressForStaff(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findAppealsInProgressByClientIds(yield this.assignedClientIds(staffId));
        });
    }
    getCompletedAppealsForStaff(staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appealRepo.findCompletedAppealsByClientIds(yield this.assignedClientIds(staffId));
        });
    }
}
exports.AppealService = AppealService;
