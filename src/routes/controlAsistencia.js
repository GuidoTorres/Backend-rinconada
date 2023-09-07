const router = require("express").Router();
const control = require("../controllers/controlAsistencia");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, control.actulizarFechaFin)

module.exports = router