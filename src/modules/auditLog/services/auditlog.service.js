import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import { AuditLogRepository } from "../repositories/auditlog.repository.js";

export class AuditLogService {
    static createAuditLog = async (data) =>{ 
        const auditlog = await AuditLogRepository.createAuditLog(data);
        return auditlog;
    }

    static getAuditLogById = async (id) =>{
        if(!isValidObjectId(id)){
            throw Error("identifiant audit invalid")
        }
        const auditlog = await AuditLogRepository.getAuditLogById(id);
        return auditlog;
    }
}