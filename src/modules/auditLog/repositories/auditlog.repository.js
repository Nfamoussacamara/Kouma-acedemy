import { auditLogModel } from "../infrastructure/persistence/models/auditlog.model.js";


export class AuditLogRepository {
    
    static createAuditLog = async (data) =>{
        
        try{
            const auditlog = await auditLogModel.create(data)
            return auditlog;
        }catch(error){
            console.log("erreur lors de la creaiton de l'audit : ",error.message)
            return null
        }
    }

    static getAuditLogById = async (id) =>{

         try{
            const auditlog = await auditLogModel.findById(id)
            return auditlog;
        }catch(error){
            console.log("erreur lors de la recuperation de l'audit : ",error.message)
            return null
        }
    }

}