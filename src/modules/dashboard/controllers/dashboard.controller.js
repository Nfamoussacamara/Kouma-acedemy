import { asyncHandler } from "../../../shared/errors/asyncHandler.js";
import DashboardService from "../services/dashboard.services.js";

export default class DashboardController {
    static getDashboardStats = asyncHandler(async (req, res) => {
        const data = await DashboardService.getDashboardStats();
        res.json({ success: true, data });
    })

    static getMonthlyCharts = asyncHandler(async (req, res) => {
        const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
        const data = await DashboardService.getMonthlyCharts(year);
        res.json({ success: true, data });
    })
}   