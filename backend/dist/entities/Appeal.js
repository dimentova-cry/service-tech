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
exports.Appeal = void 0;
const typeorm_1 = require("typeorm");
const AppealStatus_1 = require("./AppealStatus");
const Client_1 = require("./Client");
const Staff_1 = require("./Staff");
// Объявление сущности (таблицы) "appeals" для хранения обращений
let Appeal = class Appeal {
};
exports.Appeal = Appeal;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Appeal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 25 }),
    __metadata("design:type", String)
], Appeal.prototype, "mechanism", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 20,
        default: "Средний",
    }),
    __metadata("design:type", String)
], Appeal.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 256 }),
    __metadata("design:type", String)
], Appeal.prototype, "problem", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60 }),
    __metadata("design:type", String)
], Appeal.prototype, "fio_client", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => AppealStatus_1.AppealStatus, (status) => status.appeals),
    __metadata("design:type", AppealStatus_1.AppealStatus)
], Appeal.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Appeal.prototype, "date_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 256, nullable: true }),
    __metadata("design:type", String)
], Appeal.prototype, "appeal_desc", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Appeal.prototype, "date_close", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Staff_1.Staff, (staff) => staff.closed_appeals, { nullable: true }),
    __metadata("design:type", Staff_1.Staff)
], Appeal.prototype, "fio_staff_close_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Staff_1.Staff, (staff) => staff.opened_appeals, { nullable: true }),
    __metadata("design:type", Staff_1.Staff)
], Appeal.prototype, "fio_staff_open_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Client_1.Client, (client) => client.appeals, { nullable: true }),
    __metadata("design:type", Client_1.Client)
], Appeal.prototype, "company_name_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], Appeal.prototype, "fio_staff", void 0);
exports.Appeal = Appeal = __decorate([
    (0, typeorm_1.Entity)("appeals")
], Appeal);
