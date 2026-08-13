import DashboardRepository from "../repositories/dashboard.repository.js";


export default class DashboardController {
    static async getDashboardStats(req, res) {
        const data = await DashboardRepository.getDashboardStats();
        res.json({ success: true, data });
    }
}