const router = require("express").Router();
const sucursal = require("../controllers/sucursal");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, sucursal.getsucursal);
router.post("/",checkAuth,checkAuditoria, sucursal.postSucursal);
router.put("/:id",checkAuth,checkAuditoria, sucursal.updateSucursal)
router.delete("/:id",checkAuth,checkAuditoria, sucursal.deleteSucursal)
module.exports = router;