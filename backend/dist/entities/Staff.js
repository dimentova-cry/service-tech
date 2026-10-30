"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Staff = void 0;
const typeorm_1 = require("typeorm");
const Role_1 = require("./Role");
const Appeal_1 = require("./Appeal");
const Client_1 = require("./Client");
// Сущность для таблицы сотрудников
let Staff = class Staff {
};
exports.Staff = Staff;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Staff.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], Staff.prototype, "login_staff", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Staff.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], Staff.prototype, "password_plain", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], Staff.prototype, "fio_staff", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Role_1.Role, (role) => role.staffs),
    __metadata("design:type", Role_1.Role)
], Staff.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Appeal_1.Appeal, (appeal) => appeal.fio_staff_open_id),
    __metadata("design:type", Array)
], Staff.prototype, "opened_appeals", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Appeal_1.Appeal, (appeal) => appeal.fio_staff_close_id),
    __metadata("design:type", Array)
], Staff.prototype, "closed_appeals", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 12, nullable: true }),
    __metadata("design:type", String)
], Staff.prototype, "phone_number_staff", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40, nullable: true }),
    __metadata("design:type", String)
], Staff.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Staff.prototype, "telegram_id", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => Client_1.Client, (client) => client.assigned_staff),
    (0, typeorm_1.JoinTable)({
        name: "staff_clients",
        joinColumn: { name: "staff_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "client_id", referencedColumnName: "id" },
    }),
    __metadata("design:type", Array)
], Staff.prototype, "assigned_clients", void 0);
exports.Staff = Staff = __decorate([
    (0, typeorm_1.Entity)("staffs")
], Staff);
