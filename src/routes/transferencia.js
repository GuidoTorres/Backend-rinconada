const router = require("express").Router();
const transferencia = require("../controllers/transferencia");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/realizada/:id",checkAuth, transferencia.getTransferenciaRealizada)
router.get("/recibida/:id",checkAuth, transferencia.getTransferenciaRecibida)

router.post("/retornar/:id",checkAuth,checkAuditoria, transferencia.retornarTransferencia)
router.put("/:id",checkAuth,checkAuditoria, transferencia.updateTransferencia)
router.delete("/:id",checkAuth,checkAuditoria, transferencia.deleteTransferencia)
module.exports = router