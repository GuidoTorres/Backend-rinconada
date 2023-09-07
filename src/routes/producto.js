const router = require("express").Router();
const producto = require("../controllers/producto");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");
const multer = require("../middleware/multerImage")


router.get("/",checkAuth, producto.getProducto)
router.get("/:id",checkAuth, producto.getProductoById)
router.post("/",checkAuth,  multer(),checkAuditoria, producto.postProducto)
router.put("/:id",checkAuth,multer(),checkAuditoria, producto.updateProducto)
router.delete("/:id",checkAuth,checkAuditoria, producto.deleteProducto)
module.exports = router