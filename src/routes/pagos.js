const router = require("express").Router();
const pago = require("../controllers/pago");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, pago.getPagoFecha);
router.get("/historial",checkAuth, pago.historialProgramacion);
router.get("/fechas",checkAuth, pago.filtroPagoFecha);
router.get("/individual/lista",checkAuth, pago.getListaPagoIndividual);
router.get("/validacion/:id",checkAuth, pago.validacionPago);
router.get("/buscar",checkAuth, pago.BusquedaPagos)
router.post("/",checkAuth, checkAuditoria, pago.postPago);
router.post("/asociacion",checkAuth,checkAuditoria, pago.asociacionPago);
router.post("/programacion",checkAuth,checkAuditoria, pago.createProgramacion);
router.post("/programacion/multiple",checkAuth,checkAuditoria, pago.createProgramacionMultiple);
router.post("/multiple",checkAuth,checkAuditoria, pago.postMultiplePagos);
router.post("/reprogramacion",checkAuth,checkAuditoria, pago.reprogramacionPago);
router.put("/:id",checkAuth,checkAuditoria, pago.updateProgramacion);
router.put("/multiple/:id",checkAuth, checkAuditoria, pago.updateProgramacionMultiple);
router.delete("/:id",checkAuth,checkAuditoria, pago.deletePago);
router.delete("/asociacion/:id",checkAuth,checkAuditoria, pago.deletePagoAsociacion);

module.exports = router;
