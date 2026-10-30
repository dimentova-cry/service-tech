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
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("./data-source");
// --- НОВЫЕ ИМПОРТЫ ДЛЯ СИДИРОВАНИЯ ---
const bcrypt_1 = __importDefault(require("bcrypt"));
const Role_1 = require("./entities/Role");
const Admin_1 = require("./entities/Admin");
const AppealStatus_1 = require("./entities/AppealStatus");
const POinfo_1 = require("./entities/POinfo");
const Staff_1 = require("./entities/Staff");
const Client_1 = require("./entities/Client");
const Appeal_1 = require("./entities/Appeal"); // <-- НОВЫЙ ИМПОРТ
// ----------------------------------------
// ... (остальные импорты сервисов, роутеров и swagger) ...
const AuthService_1 = require("./services/AuthService");
const AdminService_1 = require("./services/AdminService");
const ClientService_1 = require("./services/ClientService");
const StaffService_1 = require("./services/StaffService");
const AppealService_1 = require("./services/AppealService");
const POinfoService_1 = require("./services/POinfoService");
const TelegramService_1 = require("./services/TelegramService");
const auth_routes_1 = require("./routes/auth.routes");
const admin_routes_1 = require("./routes/admin.routes");
const client_routes_1 = require("./routes/client.routes");
const staff_routes_1 = require("./routes/staff.routes");
const appeal_routes_1 = require("./routes/appeal.routes");
const info_routes_1 = require("./routes/info.routes");
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const swagger_1 = require("./swagger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// ... (initServices и setupRoutes) ...
/**
 * Инициализирует все сервисы приложения...
 */
const initServices = (dataSource) => {
    // ... (без изменений) ...
    const telegramService = new TelegramService_1.TelegramService(dataSource);
    const authService = new AuthService_1.AuthService(dataSource);
    const adminService = new AdminService_1.AdminService(dataSource);
    const clientService = new ClientService_1.ClientService(dataSource, telegramService);
    const staffService = new StaffService_1.StaffService(dataSource);
    const appealService = new AppealService_1.AppealService(dataSource, telegramService);
    const poinfoService = new POinfoService_1.POinfoService(dataSource);
    return {
        authService,
        adminService,
        clientService,
        staffService,
        appealService,
        poinfoService,
        telegramService,
    };
};
/**
 * Настраивает роуты приложения...
 */
const setupRoutes = (services) => {
    // ... (без изменений) ...
    app.use("/api/auth", (0, auth_routes_1.authRouter)(services.authService));
    app.use("/api/admin", (0, admin_routes_1.adminRouter)(services.adminService));
    app.use("/api/clients", (0, client_routes_1.clientRouter)(services.clientService));
    app.use("/api/staff", (0, staff_routes_1.staffRouter)(services.staffService));
    app.use("/api/appeals", (0, appeal_routes_1.appealRouter)(services.appealService));
    app.use("/api/info", (0, info_routes_1.infoRouter)(services.poinfoService));
    app.use("/api/reports", report_routes_1.default);
};
(0, swagger_1.setupSwagger)(app);
/**
 * Очищает таблицы базы данных в безопасном порядке (от дочерних к родительским).
 * @param dataSource Экземпляр TypeORM DataSource.
 */
const clearDatabase = (dataSource) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("⚠️ Clearing database...");
    // Порядок важен из-за внешних ключей:
    // 1. Appeal (зависит от всех: Staff, Client, AppealStatus)
    // 2. Admin, Staff, Client (зависят от Role)
    // 3. AppealStatus, POinfo
    // 4. Role (родительская)
    // Используем TypeORM QueryRunner для выполнения чистого SQL TRUNCATE (для PostgreSQL)
    const queryRunner = dataSource.createQueryRunner();
    yield queryRunner.connect();
    try {
        yield queryRunner.query("TRUNCATE TABLE appeals RESTART IDENTITY CASCADE;");
        console.log("   - Appeals cleared.");
        yield queryRunner.query("TRUNCATE TABLE admins RESTART IDENTITY CASCADE;");
        yield queryRunner.query("TRUNCATE TABLE staffs RESTART IDENTITY CASCADE;");
        yield queryRunner.query("TRUNCATE TABLE clients RESTART IDENTITY CASCADE;");
        console.log("   - Users (Admins, Staffs, Clients) cleared.");
        yield queryRunner.query("TRUNCATE TABLE appeal_status RESTART IDENTITY CASCADE;");
        yield queryRunner.query('TRUNCATE TABLE "POinfo" RESTART IDENTITY CASCADE;'); // Обратите внимание на кавычки для POinfo
        console.log("   - AppealStatus and POinfo cleared.");
        yield queryRunner.query("TRUNCATE TABLE roles RESTART IDENTITY CASCADE;");
        console.log("   - Roles cleared.");
    }
    catch (error) {
        console.error("Error during database clear:", error);
    }
    finally {
        yield queryRunner.release();
    }
    console.log("✅ Database cleared successfully!");
});
/**
 * ФУНКЦИЯ ДЛЯ ЗАПОЛНЕНИЯ БАЗЫ ДАННЫХ ДАННЫМИ ПО УМОЛЧАНИЮ (СИДИРОВАНИЕ)
 * Заполняет роли, статусы обращений, справочную информацию и создает
 * тестовые учетные записи и обращения.
 * @param dataSource Экземпляр TypeORM DataSource.
 */
const seedDatabase = (dataSource) => __awaiter(void 0, void 0, void 0, function* () {
    // Проверяем флаг FORCE_SEED из .env
    const forceSeed = false;
    // 1. Проверка наличия администраторов
    const adminRepo = dataSource.getRepository(Admin_1.Admin);
    const adminCount = yield adminRepo.count();
    if (adminCount > 0 && !forceSeed) {
        console.log("Database already seeded. Skipping initial data setup.");
        return;
    }
    // Если FORCE_SEED=true или база данных пуста, выполняем очистку (если не пуста)
    if (adminCount > 0 && forceSeed) {
        yield clearDatabase(dataSource);
    }
    else if (adminCount === 0) {
        console.log("Database is empty. Starting seeding process...");
    }
    // Исходный пароль, который будет использоваться для всех учетных записей по умолчанию
    const defaultPlainPassword = "123456";
    // Хешируем его один раз
    const hashedPassword = yield bcrypt_1.default.hash(defaultPlainPassword, 10);
    // --- УТИЛИТА ДАТЫ ---
    /**
     * Возвращает объект Date, смещенный на указанное количество дней, месяцев и лет назад.
     * @param daysAgo Дни назад
     * @param monthsAgo Месяцы назад
     * @param yearsAgo Годы назад
     */
    const getDate = (daysAgo = 0, monthsAgo = 0, yearsAgo = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        d.setMonth(d.getMonth() - monthsAgo);
        d.setFullYear(d.getFullYear() - yearsAgo);
        // Для более точного сидирования, сбросим секунды/миллисекунды для чистоты
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d;
    };
    // --------------------
    // 2. Сидирование ролей
    const roleRepo = dataSource.getRepository(Role_1.Role);
    const adminRole = roleRepo.create({ role: "admin" });
    const staffRole = roleRepo.create({ role: "staff" });
    const clientRole = roleRepo.create({ role: "client" });
    yield roleRepo.save([adminRole, staffRole, clientRole]);
    console.log("✅ Roles seeded: admin, staff, client.");
    // 3. Сидирование статусов обращений
    const statusRepo = dataSource.getRepository(AppealStatus_1.AppealStatus);
    const openStatus = statusRepo.create({ st: "new" });
    const inProgressStatus = statusRepo.create({ st: "in_progress" });
    const completedStatus = statusRepo.create({ st: "completed" });
    const closedStatus = statusRepo.create({ st: "cancel" });
    // Сохраняем, чтобы получить объекты с ID для Appeal
    yield statusRepo.save([
        openStatus,
        inProgressStatus,
        completedStatus,
        closedStatus,
    ]);
    console.log("✅ Appeal Statuses seeded: new, in_progress, completed, cancel.");
    // 4. Сидирование POinfo
    const infoRepo = dataSource.getRepository(POinfo_1.POinfo);
    const defaultInfo = infoRepo.create({
        TextInfo: "Система управления обращениями. Версия 1.0",
    });
    yield infoRepo.save(defaultInfo);
    console.log("✅ POinfo seeded.");
    // 5. Создание администратора по умолчанию
    const defaultAdmin = adminRepo.create({
        login_admin: "admin",
        password: hashedPassword,
        password_plain: defaultPlainPassword,
        fio_admin: "Default Administrator",
        phone_number_admin: "79000000000",
        telegram_id: "test_admin",
        role: adminRole,
    });
    yield adminRepo.save(defaultAdmin);
    console.log(`🚀 Default Admin created: Login: 'admin', Password: '${defaultPlainPassword}'`);
    // 6. Создание сотрудников (Staff)
    const staffRepo = dataSource.getRepository(Staff_1.Staff);
    const defaultStaff = staffRepo.create({
        login_staff: "staff",
        password: hashedPassword,
        password_plain: defaultPlainPassword,
        fio_staff: "Default Staff Member",
        role: staffRole,
    });
    const staff2 = staffRepo.create({
        login_staff: "staff2",
        password: hashedPassword,
        password_plain: defaultPlainPassword,
        fio_staff: "Tech Specialist A",
        role: staffRole,
    });
    const staff3 = staffRepo.create({
        login_staff: "staff3",
        password: hashedPassword,
        password_plain: defaultPlainPassword,
        fio_staff: "Support Manager B",
        role: staffRole,
    });
    yield staffRepo.save([defaultStaff, staff2, staff3]);
    const allStaff = [defaultStaff, staff2, staff3];
    console.log(`🚀 ${allStaff.length} Staff members created.`);
    // 7. Создание клиентов (Client)
    const clientRepo = dataSource.getRepository(Client_1.Client);
    const defaultClient = clientRepo.create({
        login_client: "client",
        password_hash: hashedPassword,
        password_plain: defaultPlainPassword,
        phone_number_client: "79001111111",
        company_name: "Default Client Company",
        role: clientRole,
        telegram_id: "test_client",
    });
    const client2 = clientRepo.create({
        login_client: "client2",
        password_hash: hashedPassword,
        password_plain: defaultPlainPassword,
        phone_number_client: "79002222222",
        company_name: "OOO Global Tech",
        role: clientRole,
        telegram_id: "test_client2",
    });
    const client3 = clientRepo.create({
        login_client: "client3",
        password_hash: hashedPassword,
        password_plain: defaultPlainPassword,
        phone_number_client: "79003333333",
        company_name: "ZAO Innovation",
        role: clientRole,
        telegram_id: "test_client3",
    });
    const client4 = clientRepo.create({
        login_client: "client4",
        password_hash: hashedPassword,
        password_plain: defaultPlainPassword,
        phone_number_client: "79004444444",
        company_name: "IP Petrov",
        role: clientRole,
        telegram_id: "test_client4",
    });
    yield clientRepo.save([defaultClient, client2, client3, client4]);
    const allClients = [defaultClient, client2, client3, client4];
    console.log(`🚀 ${allClients.length} Clients created.`);
    // =========================================================================
    // 8. Создание тестовых обращений (Appeals)
    // =========================================================================
    const appealRepo = dataSource.getRepository(Appeal_1.Appeal);
    const now = getDate(); // Сегодня
    const yesterday = getDate(1); // Вчера
    const twoDaysAgo = getDate(2); // Два дня назад
    const threeDaysAgo = getDate(3); // Три дня назад (на этой неделе)
    const fiveDaysAgo = getDate(5); // Пять дней назад (в этом месяце)
    const sixMonthsAgo = getDate(0, 6, 0); // Шесть месяцев назад (в этом году)
    const lastYearDate = getDate(0, 0, 1); // Год назад (в прошлом году)
    const appealsToSeed = [];
    // --- Исходные 3 обращения ---
    // 8.1. Открытое обращение (New)
    appealsToSeed.push(appealRepo.create({
        mechanism: "Телефонный звонок",
        problem: "Не работает API интеграция с системой 1С.",
        fio_client: defaultClient.company_name,
        status: openStatus, // Статус: new
        date_start: now,
        appeal_desc: "Клиент сообщил о проблеме сразу после обновления.",
        fio_staff_open_id: defaultStaff,
        company_name_id: defaultClient,
        fio_staff: defaultStaff.fio_staff,
    }));
    // 8.2. Обращение в работе (In Progress)
    appealsToSeed.push(appealRepo.create({
        mechanism: "Электронная почта",
        problem: "Ошибка в отчете за прошлый квартал.",
        fio_client: client2.company_name,
        status: inProgressStatus, // Статус: in_progress
        date_start: yesterday,
        appeal_desc: "Передано техническому специалисту для анализа данных.",
        fio_staff_open_id: staff2,
        company_name_id: client2,
        fio_staff: staff2.fio_staff,
    }));
    // 8.3. Отмененное обращение (Cancel)
    appealsToSeed.push(appealRepo.create({
        mechanism: "Telegram",
        problem: "Проблема с доступом к личному кабинету.",
        fio_client: client3.company_name,
        status: closedStatus, // Статус: cancel
        date_start: twoDaysAgo,
        appeal_desc: "Клиент отменил обращение, решив проблему самостоятельно.",
        date_close: yesterday, // Установлена дата закрытия
        fio_staff_open_id: staff3,
        fio_staff_close_id: staff3, // Закрыл тот же сотрудник
        company_name_id: client3,
        fio_staff: staff3.fio_staff,
    }));
    // ------------------------------------
    // --- 5 Завершенных обращений (Completed) с разным временем ---
    // 8.4. Завершено СЕГОДНЯ
    appealsToSeed.push(appealRepo.create({
        mechanism: "Личный кабинет",
        problem: "Не загружается логотип в настройках профиля.",
        fio_client: defaultClient.company_name,
        status: completedStatus,
        date_start: yesterday,
        date_close: now,
        appeal_desc: "Проблема устранена после очистки кэша на сервере.",
        fio_staff_open_id: defaultStaff,
        fio_staff_close_id: staff2,
        company_name_id: defaultClient,
        fio_staff: staff2.fio_staff,
    }));
    // 8.5. Завершено НА ЭТОЙ НЕДЕЛЕ (3 дня назад)
    appealsToSeed.push(appealRepo.create({
        mechanism: "Электронная почта",
        problem: "Запрос на новую функцию отчетности.",
        fio_client: defaultClient.company_name,
        status: completedStatus,
        date_start: fiveDaysAgo,
        date_close: threeDaysAgo,
        appeal_desc: "Новая функция добавлена и протестирована. Клиент доволен.",
        fio_staff_open_id: staff2,
        fio_staff_close_id: defaultStaff,
        company_name_id: defaultClient,
        fio_staff: defaultStaff.fio_staff,
    }));
    // 8.6. Завершено В ЭТОМ МЕСЯЦЕ (5 дней назад)
    // Поскольку сейчас Декабрь (2025), это обращение тоже в Декабре.
    appealsToSeed.push(appealRepo.create({
        mechanism: "Телефонный звонок",
        problem: "Проблемы с авторизацией нескольких пользователей.",
        fio_client: defaultClient.company_name,
        status: completedStatus,
        date_start: getDate(7),
        date_close: fiveDaysAgo,
        appeal_desc: "Сброшен пароль и настроена двухфакторная аутентификация.",
        fio_staff_open_id: staff3,
        fio_staff_close_id: staff3,
        company_name_id: defaultClient,
        fio_staff: staff3.fio_staff,
    }));
    // 8.7. Завершено В ЭТОМ ГОДУ (6 месяцев назад)
    appealsToSeed.push(appealRepo.create({
        mechanism: "Telegram",
        problem: "Перенос данных со старого сервера.",
        fio_client: defaultClient.company_name,
        status: completedStatus,
        date_start: getDate(10, 6, 0), // Старт 6 месяцев назад + 10 дней
        date_close: sixMonthsAgo,
        appeal_desc: "Успешная миграция базы данных и файлов.",
        fio_staff_open_id: staff2,
        fio_staff_close_id: staff2,
        company_name_id: defaultClient,
        fio_staff: staff2.fio_staff,
    }));
    // 8.8. Завершено В ПРОШЛОМ ГОДУ
    appealsToSeed.push(appealRepo.create({
        mechanism: "Электронная почта",
        problem: "Первоначальная настройка и внедрение системы.",
        fio_client: defaultClient.company_name,
        status: completedStatus,
        date_start: getDate(30, 0, 1), // Старт год назад + 30 дней
        date_close: lastYearDate,
        appeal_desc: "Проект полностью завершен в прошлом году.",
        fio_staff_open_id: defaultStaff,
        fio_staff_close_id: staff3,
        company_name_id: defaultClient,
        fio_staff: staff3.fio_staff,
    }));
    // ------------------------------------
    // --- Дополнительные обращения (New и In Progress) ---
    // 8.9. Новое обращение
    appealsToSeed.push(appealRepo.create({
        mechanism: "Личный кабинет",
        problem: "Запрос на предоставление API ключа.",
        fio_client: defaultClient.company_name,
        status: openStatus,
        date_start: now,
        appeal_desc: "Клиент отправил запрос через форму в ЛК.",
        fio_staff_open_id: staff2,
        company_name_id: defaultClient,
        fio_staff: staff2.fio_staff,
    }));
    // 8.10. В работе
    appealsToSeed.push(appealRepo.create({
        mechanism: "Телефонный звонок",
        problem: "Система упала, нужна срочная помощь.",
        fio_client: defaultClient.company_name,
        status: inProgressStatus,
        date_start: getDate(1, 1), // Месяц и 1 день назад
        appeal_desc: "Критическая ошибка. Проблема локализована, ведется ремонт.",
        fio_staff_open_id: staff3,
        company_name_id: defaultClient,
        fio_staff: staff3.fio_staff,
    }));
    yield appealRepo.save(appealsToSeed);
    console.log(`✅ ${appealsToSeed.length} Test Appeals seeded.`);
    // =========================================================================
    console.log("🎉 Database seeding completed successfully!");
});
/**
 * Асинхронная функция для запуска всего приложения.
 */
const startApp = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield data_source_1.AppDataSource.initialize();
        console.log("Database connected!");
        // --- ВЫЗОВ ФУНКЦИИ СИДИРОВАНИЯ ---
        yield seedDatabase(data_source_1.AppDataSource);
        // ------------------------------------
        // ... (инициализация сервисов, роутов и запуск сервера) ...
        const services = initServices(data_source_1.AppDataSource);
        setupRoutes(services);
        app.listen(5000, "0.0.0.0", () => {
            console.log("Backend running on port 5000");
        });
    }
    catch (error) {
        console.error("Application startup failed:", error);
        process.exit(1);
    }
});
startApp();
// ... (обработчик SIGINT) ...
process.on("SIGINT", () => {
    data_source_1.AppDataSource.destroy();
    process.exit(0);
});
