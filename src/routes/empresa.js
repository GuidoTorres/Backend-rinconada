const router = require("express").Router();
const empresa = require("../controllers/empresa");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, empresa.getEmpresa);
router.get("/:id",checkAuth, empresa.getEmpresaById);
router.post("/",checkAuth,checkAuditoria, empresa.postEmpresa);
router.put("/:id",checkAuth,checkAuditoria,empresa.updateEmpresa);
router.delete("/:id",checkAuth,checkAuditoria, empresa.deleteEmpresa);
module.exports = router;
