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
exports.POinfoService = void 0;
const POinfoRepository_1 = require("../repositories/POinfoRepository");
/**
 * Сервис для работы с дополнительной информацией (POinfo)
 * Предоставляет методы для получения и обновления информации
 */
class POinfoService {
    constructor(dataSource) {
        // Инициализация репозитория для работы с POinfo
        this.poInfoRepo = new POinfoRepository_1.POinfoRepository(dataSource);
    }
    /**
     * Получение информации "О нас"
     * @returns Объект с информацией или null если не найдено
     */
    getAboutInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.poInfoRepo.getInfo();
        });
    }
    /**
     * Обновление информации "О нас"
     * @param text Новый текст информации
     * @returns Обновленный объект с информацией
     * @throws Ошибка если не удалось обновить информацию
     */
    updateAboutInfo(text) {
        return __awaiter(this, void 0, void 0, function* () {
            // Валидация длины текста
            if (text.length > 255) {
                throw new Error("Текст информации не должен превышать 255 символов");
            }
            return this.poInfoRepo.updateInfo(text);
        });
    }
}
exports.POinfoService = POinfoService;
