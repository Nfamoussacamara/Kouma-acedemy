import rateLimit, { ipKeyGenerator } from "express-rate-limit";


const rateLimitHandler = (message) => {
    return (req, res) => {

        res.status(429).json({
            message: message,
            error: "TOO_MANY_REQUESTS",
            statusCode: 429
        });

    };
};



export const loginRateLimit = rateLimit({

    windowMs: 5 * 60 * 1000, // 15 minutes

    max: 5,


    keyGenerator: (req) => {

        const ip = ipKeyGenerator(req.ip);

        const username = req.body?.username || "unknown";

        return `${ip}:${username}`;
    },


    standardHeaders: true, //on envoi l'etat du rate-limit dans le header de la reponse aux clients(front,...)
    legacyHeaders: false, // on supprime les anciens headers


    handler: rateLimitHandler(
        "Trop de tentatives de connexion. Réessayez  dans 5 mintutes"
    )

});



export const apiRateLimit = rateLimit({

    windowMs: 15 * 60 * 1000,


    max: (req) => {

        const role = req.user?.type?.toLowerCase();

        return role === "admin" ? 3000 : 150;
    },


    standardHeaders: true,
    legacyHeaders: false,


    handler: rateLimitHandler(
        "Trop de requêtes. Réessayez dans 15 minutes ."
    )

});