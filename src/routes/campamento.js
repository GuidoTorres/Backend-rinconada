const router = require("express").Router();
const campamento = require("../controllers/campamento");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");


router.get("/",checkAuth, campamento.getCampamento)
router.get("/:id",checkAuth, campamento.getCampamentoById)
router.post("/",checkAuth,checkAuditoria, campamento.postCampamento)
router.put("/:id",checkAuth,checkAuditoria, campamento.updateCampamento)
router.delete("/:id",checkAuth,checkAuditoria, campamento.deleteCampamento)
module.exports = router