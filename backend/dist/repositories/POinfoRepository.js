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
exports.POinfoRepository = void 0;
const typeorm_1 = require("typeorm");
const POinfo_1 = require("../entities/POinfo");
/**
 * Репозиторий для работы с дополнительной информацией (POinfo)
 * Предполагается, что в таблице будет только одна запись с id = 1
 */
class POinfoRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        // Инициализация стандартного репозитория для сущности POinfo
        super(POinfo_1.POinfo, dataSource.createEntityManager());
        this.dataSource = dataSource;
    }
    /**
     * Получение информации (всегда получает запись с id = 1)
     * @returns Объект с информацией или null если не найден
     */
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findOne({ where: { id: 1 } });
        });
    }
    /**
     * Обновление или создание информации
     * @param text Текст информации для сохранения
     * @returns Обновленный или созданный объект POinfo
     */
    updateInfo(text) {
        return __awaiter(this, void 0, void 0, function* () {
            // Пытаемся получить существующую запись
            let info = yield this.getInfo();
            if (!info) {
                // Если записи нет - создаем новую
                info = this.create({
                    id: 1, // Явно указываем id = 1
                    TextInfo: text,
                });
            }
            else {
                // Если запись есть - обновляем текст
                info.TextInfo = text;
            }
            // Сохраняем изменения
            return this.save(info);
        });
    }
}
exports.POinfoRepository = POinfoRepository;
