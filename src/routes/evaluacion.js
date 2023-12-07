const router = require("express").Router();
const evaluacion = require("../controllers/evaluacion");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/", evaluacion.getEvaluacion)
router.get("/:id", evaluacion.getEvaluacionById)
router.get("/activar/:id", evaluacion.activarEvaluacion)
router.post("/", evaluacion.postEvaluacion)
router.put("/:id", evaluacion.updateEvaluacion)
router.delete("/:id", evaluacion.deleteEvaluacion)
module.exports = router