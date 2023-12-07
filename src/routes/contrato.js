const router = require("express").Router();
const contrato = require("../controllers/contrato");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",  contrato.getContrato);
router.get("/estadisticas", contrato.estadisticasContrato);
router.get("/trabajador/evaluacion", contrato.getTrabajadorContratoEvaluacion);
router.get("/asociacion/trabajador/:id", contrato.getHistorialContratoTrabajadores)
router.get("/last",  contrato.getLastId);
router.get("/activar/:id", contrato.activarContrato);
router.get("/updateall", contrato.updateAllContratos)
router.post("/suspension",   contrato.registrarSuspension);
router.post("/",   contrato.postContrato);
router.post(
  "/asociacion",

  contrato.postContratoAsociacion
);
router.get("/:id", contrato.getContratoById);
router.get("/asociacion/:id",  contrato.getContratoAsociacionById);
router.put("/:id",  contrato.updateContrato);
router.delete("/:id",  contrato.deleteContrato);
module.exports = router;
