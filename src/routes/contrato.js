const router = require("express").Router();
const contrato = require("../controllers/contrato");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/", checkAuth, contrato.getContrato);
router.get("/trabajador/evaluacion", contrato.getTrabajadorContratoEvaluacion);
router.get("/asociacion/trabajador/:id", contrato.getHistorialContratoTrabajadores)
router.get("/last", checkAuth, contrato.getLastId);
router.get("/activar/:id", contrato.activarContrato);
router.get("/updateall", contrato.updateAllContratos)
router.post("/suspension", checkAuth, checkAuditoria, contrato.registrarSuspension);
router.post("/", checkAuth, checkAuditoria, contrato.postContrato);
router.post(
  "/asociacion",
  checkAuth,
  checkAuditoria,
  contrato.postContratoAsociacion
);
router.get("/:id", contrato.getContratoById);
router.get("/asociacion/:id", checkAuth, contrato.getContratoAsociacionById);
router.put("/:id", checkAuth, checkAuditoria, contrato.updateContrato);
router.delete("/:id", checkAuth, checkAuditoria, contrato.deleteContrato);
module.exports = router;
