import { isValidObjectId } from "../../../infrastructure/database/mongoose.js";
import { AuditLogRepository } from "../repositories/auditlog.repository.js";

export class AuditLogService {
    static create = async (date) =>{ 
        const auditlog = await AuditLogRepository.create(date);
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