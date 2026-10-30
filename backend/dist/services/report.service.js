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
exports.ReportService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const archiver_1 = __importDefault(require("archiver"));
const REPORTS_DIR = path_1.default.resolve(__dirname, "../../storage/reports");
class ReportService {
    /**
     * Возвращает список всех .xlsx отчётов
     */
    static getAllReports() {
        if (!fs_1.default.existsSync(REPORTS_DIR)) {
            return [];
        }
        return fs_1.default.readdirSync(REPORTS_DIR).filter((file) => file.endsWith(".xlsx"));
    }
    /**
     * Возвращает абсолютный путь к конкретному отчёту
     * + защита от ../
     */
    static getReportPath(filename) {
        if (!filename.endsWith(".xlsx")) {
            throw new Error("Invalid report format");
        }
        const safeFilename = path_1.default.basename(filename);
        const filePath = path_1.default.join(REPORTS_DIR, safeFilename);
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error("Report not found");
        }
        return filePath;
    }
    /**
     * Создаёт ZIP архив со всеми отчётами и пишет его в stream
     */
    static streamAllReportsAsZip(res) {
        return __awaiter(this, void 0, void 0, function* () {
            const reports = this.getAllReports();
            if (reports.length === 0) {
                throw new Error("No reports available");
            }
            res.setHeader("Content-Type", "application/zip");
            res.setHeader("Content-Disposition", 'attachment; filename="reports.zip"');
            const archive = (0, archiver_1.default)("zip", {
                zlib: { level: 9 },
            });
            archive.on("error", (err) => {
                throw err;
            });
            archive.pipe(res);
            for (const report of reports) {
                const filePath = path_1.default.join(REPORTS_DIR, report);
                archive.file(filePath, { name: report });
            }
            yield archive.finalize();
        });
    }
}
exports.ReportService = ReportService;
