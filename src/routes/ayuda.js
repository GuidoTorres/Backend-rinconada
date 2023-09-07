const router = require("express").Router();
const ayuda = require("../controllers/ayudas");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, ayuda.getTrabajadorAyuda)
router.get("/lista",checkAuth, ayuda.getAyuda)
router.post("/pago",checkAuth,checkAuditoria, ayuda.postPagoExtraordinario);
// router.post("/pago", casa.postPagoCasa);
router.put("/programacion/:id",checkAuth,checkAuditoria, ayuda.updateProgramacionAyuda);
router.delete("/:id",checkAuth,checkAuditoria, ayuda.deletePagoAyuda)


module.exports = router;