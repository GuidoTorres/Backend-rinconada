const router = require("express").Router();
const incentivo = require("../controllers/incentivo");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");


router.get("/", incentivo.getIncentivo)
router.get("/trabajadores",checkAuth, incentivo.getTrabajadoresIncentivo)
// router.post("/", incentivo.postIncentivo)
// router.post("/multiple", incentivo.postIncentivoMultiple)
// router.post("/multiple", pago.postMultiplePagos)
// router.post("/programacion", pago.createProgramacion)
// router.delete("/:id", incentivo.deleteIncentivo)

module.exports = router