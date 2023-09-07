const router = require("express").Router();
const volquete = require("../controllers/volquete");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/", checkAuth, volquete.getVolquete)
router.get("/:id",checkAuth, volquete.getVolqueteById)
router.post("/",checkAuth,checkAuditoria, volquete.postVolquete)
router.put("/:id",checkAuth,checkAuditoria, volquete.updateVolquete)
router.delete("/:id",checkAuth,checkAuditoria, volquete.deleteVolquete)
module.exports = router