const router = require("express").Router();
const categoria = require("../controllers/productoCategoria");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, categoria.getCategoria)
router.post("/",checkAuth,checkAuditoria, categoria.postCategoria)
router.put("/:id", checkAuth,checkAuditoria,categoria.updateCategoria)
router.delete("/:id", checkAuth,checkAuditoria,categoria.deleteCategoria)
module.exports = router