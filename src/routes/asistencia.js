const router = require("express").Router();
const multer = require("../middleware/multerAsistencia")

const asistencia = require("../controllers/asistencia");
const checkAuth = require("../middleware/auth");
const checkAuditoria = require("../middleware/auditoria");



router.get("/",checkAuth, asistencia.getAsistencia)
router.get("/trabajador/:id",checkAuth, asistencia.getTrabajadorAsistencia)
router.post("/",checkAuth, checkAuditoria, asistencia.postAsistencia)
router.post("/excel",checkAuth, multer(), checkAuditoria, asistencia.getExcelAsistencia)
router.post("/trabajador",checkAuth, checkAuditoria, asistencia.postTrabajadorAsistencia)
router.put("/",checkAuth, checkAuditoria, asistencia.updateTrabajadorAsistencia)
router.put("/hora_ingreso/:id",checkAuth, checkAuditoria, asistencia.updateAsistencia)
router.delete("/:id",checkAuth, checkAuditoria, asistencia.deleteAsistencia)
module.exports = router