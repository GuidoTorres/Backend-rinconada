const router = require("express").Router();
const proveedor = require("../controllers/proveedor");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, proveedor.getProveedor);
router.post("/",checkAuth,checkAuditoria, proveedor.postProveedor);
router.put("/:id",checkAuth,checkAuditoria, proveedor.updateProveedor)
router.delete("/:id",checkAuth,checkAuditoria, proveedor.deleteProveedor)
module.exports = router;
