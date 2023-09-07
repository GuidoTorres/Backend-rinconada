const router = require("express").Router();
const evaluacion = require("../controllers/evaluacionContrato");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, evaluacion.getEvaluacionContrato)
router.get("/:id",checkAuth, evaluacion.getContratoById)
router.get("/contratoevaluacion",checkAuth, evaluacion.getContratoEvaluacionById)




module.exports = router