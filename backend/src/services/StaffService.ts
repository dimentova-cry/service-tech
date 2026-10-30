import { StaffRepository } from "../repositories/StaffRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import bcrypt from "bcrypt";
import { DataSource, In } from "typeorm";
import { AppealRepository } from "../repositories/AppealRepository";
import { ClientRepository } from "../repositories/ClientRepository";
import { Client } from "../entities/Client";

/**
 * Сервис для работы с сотрудниками (Staff)
 */
export class StaffService {
  private staffRepo: StaffRepository;
  private roleRepo: RoleRepository;
  private appealRepo: AppealRepository;
  private clientRepo: ClientRepository;

  constructor(dataSource: DataSource) {
    // Инициализация репозиториев
    this.staffRepo = new StaffRepository(dataSource);
    this.roleRepo = new RoleRepository(dataSource);
    this.appealRepo = new AppealRepository(dataSource);
    this.clientRepo = new ClientRepository(dataSource);
  }

  private assignedClientsView(clients?: Client[]) {
    return (clients ?? []).map((client) => ({
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
  async createStaff(
    login: string,
    plainPassword: string,
    fio: string,
    phone_number_staff: string | null,
    email: string | null,
  ) {
    // Проверка уникальности логина
    const exists = await this.staffRepo.findByLogin(login);
    if (exists) throw new Error("Сотрудник с таким логином уже существует");

    // Получение роли "staff"
    const role = await this.roleRepo.findByRoleName("staff");
    if (!role) throw new Error("Роль сотрудника не найдена");

    // Хеширование пароля
    const password = await bcrypt.hash(plainPassword, 10);

    // Создание сотрудника
    return this.staffRepo.createStaff(
      login,
      password,
      plainPassword,
      fio,
      role,
      phone_number_staff,
      email,
    );
  }

  /**
   * Получение заявок сотрудника
   * @param staffId ID сотрудника
   * @returns Сотрудник с связанными заявками
   */
  async getStaffAppeals(staffId: number) {
    return this.staffRepo.findOne({
      where: { id: staffId },
      relations: ["opened_appeals", "closed_appeals"], // Загружаем открытые и закрытые заявки
    });
  }

  /**
   * Удаление сотрудника
   * @param staffId ID сотрудника
   * @throws Ошибка если сотрудник не найден
   */
  async removeStaff(staffId: number) {
    await this.appealRepo.update(
      { fio_staff_close_id: { id: staffId } },
      { fio_staff_close_id: null as any },
    );

    await this.appealRepo.update(
      { fio_staff_open_id: { id: staffId } },
      { fio_staff_open_id: null as any },
    );

    return this.staffRepo.removeStaff(staffId);
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
  async editStaff(
    staffId: number,
    fio?: string,
    login?: string,
    password?: string,
    phone_number_staff?: string | null,
    email?: string | null,
  ) {
    const staff = await this.staffRepo.findByIdWithRole(staffId);
    if (!staff) throw new Error("staff не найден");

    let passwordHash;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    return this.staffRepo.editStaff(
      staffId,
      fio,
      login,
      passwordHash,
      password,
      phone_number_staff,
      email,
    );
  }

  /**
   * Получение всех сотрудников
   * @returns Массив сотрудников с загруженными ролями
   */
  async getAllStaff() {
    const staff = await this.staffRepo.find({
      relations: ["role", "assigned_clients"],
    });
    return staff.map((member) => ({
      ...member,
      assigned_clients: this.assignedClientsView(member.assigned_clients),
    }));
  }

  /**
   * Заменяет набор заказчиков, заявки которых доступны сотруднику
   */
  async setAssignedClients(staffId: number, clientIds: number[]) {
    const staff = await this.staffRepo.findOne({
      where: { id: staffId },
      relations: ["assigned_clients", "role"],
    });
    if (!staff) throw new Error("Сотрудник не найден");

    const uniqueIds = [...new Set(clientIds)];
    if (uniqueIds.length === 0) {
      staff.assigned_clients = [];
    } else {
      const clients = await this.clientRepo.findBy({ id: In(uniqueIds) });
      if (clients.length !== uniqueIds.length) {
        throw new Error("Заказчик не найден");
      }
      staff.assigned_clients = clients;
    }

    const saved = await this.staffRepo.save(staff);
    return {
      ...saved,
      assigned_clients: this.assignedClientsView(saved.assigned_clients),
    };
  }

  /**
   * Поиск сотрудника по ID
   * @param staffId ID сотрудника
   * @returns Найденный сотрудник или null
   */
  async findById(staffId: number) {
    return this.staffRepo.findOne({
      where: { id: staffId },
      relations: ["role"],
    });
  }

  /**
   * Обновление пароля сотрудника
   * @param staffId ID сотрудника
   * @param newPassword Новый пароль
   * @throws Ошибка если сотрудник не найден
   */
  async updatePassword(staffId: number, newPassword: string) {
    const staff = await this.findById(staffId);
    if (!staff) throw new Error("Сотрудник не найден");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.staffRepo.editStaff(
      staffId,
      undefined,
      undefined,
      passwordHash,
    );
  }
}
