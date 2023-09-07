const dayjs = require("dayjs");
const { verifyToken } = require("../helpers/generateToken");

const checkAuditoria = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace(/"/g, "").split(" ").pop();
    const tokenData = await verifyToken(token);
    const username = tokenData.role; 
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // Registra en un archivo
    const fs = require('fs');
    const logStream = fs.createWriteStream('auditoria.txt', {flags: 'a'});
    logStream.write(`|${timestamp}|${username}|${req.method}|${'ruta: '+req.originalUrl}|${JSON.stringify(req.body)}\n`);
    logStream.end();
    next();
  } catch (error) {
    next(error); // Pasar el error al siguiente middleware o controlador de errores
  }
};



module.exports= checkAuditoria