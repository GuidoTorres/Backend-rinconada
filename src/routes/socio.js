const router = require("express").Router();
const socio = require("../controllers/socio");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, socio.getSocio)
router.post("/",checkAuth,checkAuditoria, socio.postSocio)
router.put("/:id",checkAuth, checkAuditoria,socio.updateSocio)
router.delete("/:id",checkAuth,checkAuditoria, socio.deleteSocio)
module.exports = router