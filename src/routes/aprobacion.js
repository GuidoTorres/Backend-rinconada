const router = require("express").Router();
const aprobacion = require("../controllers/aprobacion");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, aprobacion.getAprobacion)
router.post("/asistencias",checkAuth,checkAuditoria, aprobacion.aprobacionAsistencias)
router.put("/observacion/:id",checkAuth,checkAuditoria, aprobacion.updateObservacion)
router.delete("/:id",checkAuth,checkAuditoria, aprobacion.deleteAprobacionContrato)
// router.get("/:id", almacen.getAlmacenById)
// router.post("/", almacen.postAlmacen)
// router.post("/transferencia", almacen.almacenTrasferencia)
// router.put("/:id", almacen.updateAlmacen)
// router.delete("/:id", almacen.deleteAlmacen)
// router.get("/producto/:id", almacen.getProductsByAlmacen)
module.exports = router