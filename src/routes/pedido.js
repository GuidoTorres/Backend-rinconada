const router = require("express").Router();
const pedido = require("../controllers/pedido");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");


router.get("/",checkAuth, pedido.getPedido)
router.get("/id",checkAuth, pedido.getPedidoId)
router.get("/entrada",checkAuth, pedido.getPedidoProducto)
router.get("/descargar/:id",checkAuth, pedido.descargarPedido)
// router.get("/:id", pedido.getPedidoById)
router.post("/",checkAuth,checkAuditoria, pedido.postPedido)
router.put("/:id",checkAuth,checkAuditoria, pedido.updatePedido)
router.delete("/:id",checkAuth,checkAuditoria, pedido.deletePedido)
module.exports = router