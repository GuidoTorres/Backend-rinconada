const router = require("express").Router();
const entrada = require("../controllers/entradaSalida");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");


router.get("/",checkAuth, entrada.getEntradaSalida)
router.get("/:id",checkAuth, entrada.getEntradaByAlmacen)
router.post("/",checkAuth,checkAuditoria, entrada.postEntrada)
router.post("/salida",checkAuth,checkAuditoria, entrada.postSalida)
router.post("/estadistica",checkAuth,checkAuditoria, entrada.entradaSalidaEstadistica)
router.post("/eliminar/:id",checkAuth,checkAuditoria, entrada.deleteEntradaSalida)
router.put("/:id",checkAuth,checkAuditoria, entrada.updateEntradaSalida)
module.exports = router