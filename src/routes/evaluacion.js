const router = require("express").Router();
const evaluacion = require("../controllers/evaluacion");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, evaluacion.getEvaluacion)
router.get("/:id",checkAuth, evaluacion.getEvaluacionById)
router.get("/activar/:id", evaluacion.activarEvaluacion)
router.post("/",checkAuth,checkAuditoria, evaluacion.postEvaluacion)
router.put("/:id",checkAuth,checkAuditoria, evaluacion.updateEvaluacion)
router.delete("/:id",checkAuth,checkAuditoria, evaluacion.deleteEvaluacion)
module.exports = router