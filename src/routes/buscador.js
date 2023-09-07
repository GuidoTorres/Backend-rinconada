const router = require("express").Router();
const buscador = require("../controllers/buscador");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, buscador.BusquedaPagos)



module.exports = router;