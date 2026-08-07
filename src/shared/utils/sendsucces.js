export default function sendSuccess (
    res,
    {
        data = null,
        meta = undefined
    },
    message = "Opération réussie", 
    statusCode = 200
) {

    return res.status(statusCode).json({

        success:true,

        message,

        data,

        ...(meta && {meta})

    });

};