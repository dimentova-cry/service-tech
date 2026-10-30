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
const express_1 = require("express");
const report_service_1 = require("../services/report.service");
const router = (0, express_1.Router)();
/**
 * GET /api/reports
 * Список всех отчётов
 */
router.get("/", (req, res) => {
    try {
        const reports = report_service_1.ReportService.getAllReports();
        res.json(reports);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to load reports" });
    }
});
/**
 * GET /api/reports/all
 * Скачать ВСЕ отчёты одним ZIP
 */
router.get("/all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield report_service_1.ReportService.streamAllReportsAsZip(res);
    }
    catch (error) {
        console.error(error);
        res.status(404).json({ message: "No reports available" });
    }
}));
/**
 * GET /api/reports/:filename
 * Скачать конкретный отчёт
 */
router.get("/:filename", (req, res) => {
    try {
        const filePath = report_service_1.ReportService.getReportPath(req.params.filename);
        res.download(filePath);
    }
    catch (error) {
        res.status(404).json({ message: "Report not found" });
    }
});
exports.default = router;
