import { AuditLogService } from "../modules/auditLog/services/auditlog.service.js";


export const auditDescription = (description) => {
    return (req, res, next) => {
        req.auditDescription = description;
        next();
    };
};


export const auditlogmidleware = (req, res, next) => {

    const start = Date.now();

    res.on("finish", async () => {

        try {
            const duration = Date.now() - start;

            const success = res.statusCode >= 200 && res.statusCode < 400;

            const description = success
                ? req.auditDescription
                : `${req.auditDescription} (ÉCHEC)`;
                
            await AuditLogService.create({
                user: req.user?.id || null,
                action: `${req.method}_${req.path}`,
                url: req.originalUrl,
                method: req.method,
                status: res.statusCode,
                description,
                duration,
                ip_address: req.ip
            });
        } catch(error) {
            console.error("Erreur création audit log :", error);

        }

    });

    next();
};