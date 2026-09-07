import { asyncHandler } from "../../../shared/errors/asyncHandler.js";
import DashboardRepository from "../repositories/dashboard.repository.js";

export default class DashboardController {
    static getDashboardStats = asyncHandler(async (req, res) => {
        const data = await DashboardRepository.getDashboardStats();
        res.json({ success: true, data });
    })

    static getMyStats = asyncHandler(async (req, res) => { 
        const data = await DashboardRepository.getMyStats(req.user.id);
        res.json({ success: true, data });
    })

    static getMonthlyCharts = asyncHandler(async (req, res) => {
        const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
        const data = await DashboardRepository.getMonthlyCharts(year);
        res.json({ success: true, data });
    })
}   