const router = require("express").Router();
const casa = require("../controllers/casa");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, casa.getEmpresaPago)
router.post("/programacion",checkAuth,checkAuditoria, casa.createProgramacionCasa);
// router.post("/pago", casa.postPagoCasa);
router.post("/pago",checkAuth,checkAuditoria, casa.postPagoCasaMultiple);
router.put("/programacion/:id",checkAuth,checkAuditoria, casa.updateProgramacionCasa);
router.delete("/:id",checkAuth,checkAuditoria, casa.deletePagoCasa)


// router.get("/:id", rol.getRolById)
// router.post("/", rol.postRol)
// router.put("/:id", rol.updateRol)
module.exports = router;
