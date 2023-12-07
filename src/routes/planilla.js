const router = require("express").Router();
const planilla = require("../controllers/planilla");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");
const images = require("../middleware/multerImage");

router.get("/", planilla.getPlanilla);
router.get("/pagos",checkAuth, planilla.getPlanillaPago);
router.get("/pagos/lista", planilla.getListaPago);
router.get("/asociacion",checkAuth, planilla.getListaAsociacionProgramada);
router.get("/campamento",checkAuth, planilla.campamentoPlanilla);
router.get("/historial/:id",checkAuth, planilla.getPlanillaHistoriaTrabajador);
router.get("/tareo/:id", planilla.getTareoTrabajador);
router.get("/tareo/asociacion/:id", planilla.getTareoAsociacion);
router.put("/huella/:id",checkAuth,checkAuditoria, images(), planilla.updateHuella);

// router.get("/:id", rol.getRolById)
// router.post("/", rol.postRol)
// router.put("/:id", rol.updateRol)
// router.delete("/:id", rol.deleteRol)
module.exports = router;
