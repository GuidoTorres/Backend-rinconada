const router = require("express").Router();
const requerimiento = require("../controllers/requerimiento");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/", requerimiento.getRequerimiento);
router.get("/last/id",checkAuth, requerimiento.getLastId);
router.get("/trabajador",checkAuth, requerimiento.getTrabajadorRequerimiento);
router.get("/data/trabajador",checkAuth, requerimiento.getReqTrabajador);
// router.get("/:id", requerimiento.getRequerimientoById);
router.post("/",checkAuth,checkAuditoria, requerimiento.postARequerimiento);
router.put("/producto/:id",checkAuth,checkAuditoria, requerimiento.updateRequerimientoProducto);
router.put("/:id",checkAuth,checkAuditoria, requerimiento.updateRequerimiento);
router.delete("/:id",checkAuth,checkAuditoria, requerimiento.deleteRequerimiento);
module.exports = router;
