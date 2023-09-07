const router = require("express").Router();
const rol = require("../controllers/rol");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, rol.getRol)
router.get("/:id",checkAuth, rol.getRolById)
router.post("/",checkAuth,checkAuditoria, rol.postRol)
router.put("/:id",checkAuth,checkAuditoria, rol.updateRol)
router.delete("/:id",checkAuth,checkAuditoria, rol.deleteRol)
module.exports = router