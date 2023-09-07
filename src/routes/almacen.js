const router = require("express").Router();
const almacen = require("../controllers/almacen");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth,  almacen.getAlmacen)
router.get("/:id",checkAuth, almacen.getAlmacenById)
router.post("/",checkAuth,checkAuditoria, almacen.postAlmacen)
router.post("/transferencia",checkAuth,checkAuditoria, almacen.almacenTrasferencia)
router.put("/:id",checkAuth,checkAuditoria, almacen.updateAlmacen)
router.delete("/:id",checkAuth,checkAuditoria, almacen.deleteAlmacen)
router.get("/producto/:id",checkAuth, almacen.getProductsByAlmacen)
module.exports = router