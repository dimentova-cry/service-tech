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
exports.TelegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const ClientRepository_1 = require("../repositories/ClientRepository");
const AdminRepository_1 = require("../repositories/AdminRepository");
const StaffRepository_1 = require("../repositories/StaffRepository");
dotenv_1.default.config();
class TelegramService {
    constructor(dataSource) {
        // Проверяем наличие токена бота в переменных окружения
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            // Если токен не задан, выбрасываем ошибку
            throw new Error("TELEGRAM_BOT_TOKEN не задан в .env");
        }
        // Инициализируем нового Telegram-бота с токеном и включаем режим polling
        // Режим polling позволяет боту регулярно проверять наличие новых сообщений
        this.bot = new node_telegram_bot_api_1.default(process.env.TELEGRAM_BOT_TOKEN, {
            polling: true,
        });
        // Создаем экземпляры репозиториев для работы с данными клиентов и админов
        this.clientRepo = new ClientRepository_1.ClientRepository(dataSource);
        this.adminRepo = new AdminRepository_1.AdminRepository(dataSource);
        this.staffRepo = new StaffRepository_1.StaffRepository(dataSource);
        // Вызываем метод для настройки обработчиков событий бота
        this.setupBot();
    }
    setupBot() {
        // Обработка команды /start, которая может содержать дополнительные данные (deep linking)
        // Регулярное выражение \/start (.+) извлекает любую строку после команды /start
        this.bot.onText(/\/start (.+)/, (msg, match) => __awaiter(this, void 0, void 0, function* () {
            const chatId = msg.chat.id;
            // Проверяем, что ссылка содержит дополнительный параметр (номер телефона)
            if (!match || !match[1]) {
                return this.bot.sendMessage(chatId, "❌ Некорректная ссылка");
            }
            // Извлекаем номер телефона из ссылки
            const phone = match[1]; // Например, из t.me/bot?start=79123456789
            try {
                const client = yield this.clientRepo.getClientByPhone(phone);
                const admin = yield this.adminRepo.getAdminByPhone(phone);
                const staff = yield this.staffRepo.getStaffByPhone(phone);
                if (!client && !admin && !staff) {
                    return this.bot.sendMessage(chatId, "❌ Пользователь с таким номером телефона не найден");
                }
                if (client) {
                    yield this.clientRepo.update(client.id, {
                        telegram_id: chatId.toString(),
                    });
                    this.bot.sendMessage(chatId, "Вас приветствует СервисБот! ✅ Telegram успешно привязан к профилю клиента.");
                }
                if (admin) {
                    yield this.adminRepo.update(admin.id, {
                        telegram_id: chatId.toString(),
                    });
                    this.bot.sendMessage(chatId, "Вас приветствует СервисБот! ✅ Telegram успешно привязан к профилю администратора.");
                }
                if (staff) {
                    yield this.staffRepo.update(staff.id, {
                        telegram_id: chatId.toString(),
                    });
                    this.bot.sendMessage(chatId, "Вас приветствует СервисБот! ✅ Telegram успешно привязан к профилю сотрудника.");
                }
            }
            catch (error) {
                // Обработка ошибок, если что-то пошло не так
                console.error("Ошибка при обработке /start:", error);
                this.bot.sendMessage(chatId, "⚠ Произошла ошибка, попробуйте позже");
            }
        }));
        // Обработчик для всех текстовых сообщений, которые не являются командами
        this.bot.on("message", (msg) => {
            var _a;
            if (!((_a = msg.text) === null || _a === void 0 ? void 0 : _a.startsWith("/"))) {
                // Отправляем простое эхо-сообщение для теста
                this.bot.sendMessage(msg.chat.id, `Вы написали: "${msg.text}"`);
            }
        });
    }
    /**
     * Отправляет сообщение клиенту по его номеру телефона.
     * @param phone Номер телефона клиента
     * @param message Текст сообщения
     * @returns Promise<boolean> - true, если сообщение отправлено, false в противном случае
     */
    sendMessageToClient(phone, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ищем клиента в базе данных по номеру телефона
                const client = yield this.clientRepo.getClientByPhone(phone);
                // Проверяем, существует ли клиент и привязан ли у него Telegram-аккаунт
                if (!client || !client.telegram_id) {
                    console.log(`Клиент ${phone} не привязал Telegram`);
                    return false;
                }
                // Отправляем сообщение клиенту, используя его telegram_id
                yield this.bot.sendMessage(client.telegram_id, message);
                return true;
            }
            catch (error) {
                console.error("Ошибка отправки сообщения:", error);
                return false;
            }
        });
    }
    sendMessageToStaff(phone, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ищем клиента в базе данных по номеру телефона
                const client = yield this.staffRepo.getStaffByPhone(phone);
                // Проверяем, существует ли клиент и привязан ли у него Telegram-аккаунт
                if (!client || !client.telegram_id) {
                    console.log(`Сотрудник ${phone} не привязал Telegram`);
                    return false;
                }
                // Отправляем сообщение клиенту, используя его telegram_id
                yield this.bot.sendMessage(client.telegram_id, message);
                return true;
            }
            catch (error) {
                console.error("Ошибка отправки сообщения:", error);
                return false;
            }
        });
    }
    sendMessageToAllStaff(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const allStaffsWithPhones = yield this.staffRepo.find({
                    where: { telegram_id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
                });
                for (const staff of allStaffsWithPhones) {
                    this.bot.sendMessage(staff.telegram_id, message);
                }
            }
            catch (error) {
                console.error("Ошибка отправки сообщения:", error);
            }
        });
    }
    /**
     * Отправляет сообщение админу по его номеру телефона.
     * @param phone Номер телефона админа
     * @param message Текст сообщения
     * @returns Promise<boolean> - true, если сообщение отправлено, false в противном случае
     */
    sendMessageToAdmin(phone, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ищем админа в базе данных по номеру телефона
                const admin = yield this.adminRepo.getAdminByPhone(phone);
                // Проверяем, существует ли админ и привязан ли у него Telegram-аккаунт
                if (!admin || !admin.telegram_id) {
                    console.log(`Админ ${phone} не привязал Telegram`);
                    return false;
                }
                // Отправляем сообщение админу, используя его telegram_id
                yield this.bot.sendMessage(admin.telegram_id, message);
                return true;
            }
            catch (error) {
                console.error("Ошибка отправки сообщения:", error);
                return false;
            }
        });
    }
}
exports.TelegramService = TelegramService;
