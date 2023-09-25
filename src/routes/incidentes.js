const router = require("express").Router();
const incidentes = require("../controllers/incidentes");
const images = require("../middleware/multerImage");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/", incidentes.getIncidentes);
router.get("/trabajador", incidentes.getTrabajadorContrato);
router.get("/:id", checkAuth, incidentes.getIncidenteById);
router.post(
  "/",
//   checkAuth,
  images(),
//   checkAuditoria,
  incidentes.postIncidentes
);
router.put(
  "/:id",
  checkAuth,
  images(),
  checkAuditoria,
  incidentes.updateIncidentes
);
router.delete("/:id", checkAuth, checkAuditoria, incidentes.deleteIncidente);

module.exports = router;
