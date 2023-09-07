const router = require("express").Router();
const trapiche = require("../controllers/trapiche");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, trapiche.getTrapiche)
router.get("/:id",checkAuth, trapiche.getTrapicheById)
router.post("/",checkAuth,checkAuditoria, trapiche.postTrapiche)
router.put("/:id",checkAuth,checkAuditoria, trapiche.updateTrapiche)
router.delete("/:id",checkAuth,checkAuditoria, trapiche.deleteTrapiche)
module.exports = router