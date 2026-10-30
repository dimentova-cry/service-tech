import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { Role } from "./Role";
import { Appeal } from "./Appeal";
import { Staff } from "./Staff";

// Сущность для таблицы клиентов
@Entity("clients")
export class Client {
  // Уникальный идентификатор
  @PrimaryGeneratedColumn()
  id: number;

  // Логин клиента (макс. 10 символов)
  @Column({ length: 10 })
  login_client: string;

  // Хэш пароля
  @Column()
  password_hash: string;

  // Пароль в открытом виде (небезопасно)
  @Column({ length: 10 })
  password_plain: string;

  // Номер телефона (макс. 12 символов)
  @Column({ length: 12 })
  phone_number_client: string;

  // Название компании (макс. 50 символов)
  @Column({ length: 50 })
  company_name: string;

  // ID в Telegram (необязательное поле)
  @Column({ length: 200, nullable: true })
  telegram_id: string;

  // ID пользователя ВКонтакте (необязательное поле)
  @Column({ length: 200, nullable: true })
  vk_id: string;

  // Email (макс. 40 символов)
  @Column({ length: 40, nullable: true })
  email: string;

  // Связь с ролью (многие клиенты к одной роли)
  @ManyToOne(() => Role, (role) => role.clients)
  role: Role;

  // Связь с обращениями (один клиент - много обращений)
  @OneToMany(() => Appeal, (appeal) => appeal.company_name_id)
  appeals: Appeal[];

  // Сотрудники, которым доступны заявки этого заказчика
  @ManyToMany(() => Staff, (staff) => staff.assigned_clients)
  assigned_staff: Staff[];
}
