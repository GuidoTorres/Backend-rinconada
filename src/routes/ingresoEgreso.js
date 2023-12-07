const router = require("express").Router();
const ingresoEgreso = require("../controllers/ingresoEgreso");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");

router.get("/",checkAuth, ingresoEgreso.getIngresoEgresos);
router.get("/trabajador",checkAuth, ingresoEgreso.getTrabajadorFinanza);
router.get("/saldo/:id",checkAuth, ingresoEgreso.getSaldoMensual)
router.post("/reporte/:id",checkAuth, checkAuditoria, ingresoEgreso.reporteIngreso);
router.get("/sucursal/:id",checkAuth, ingresoEgreso.getIngresoEgresosById);
router.post("/",checkAuth,checkAuditoria, ingresoEgreso.postIngresoEgreso);
router.put("/:id",checkAuth,checkAuditoria, ingresoEgreso.updateIngresoEgreso);
router.delete("/:id",checkAuth,checkAuditoria, ingresoEgreso.deleteIngresoEgreso);
router.get("/excel/:id",checkAuth, ingresoEgreso.convertJsonToExcel);
router.get("/excel/comedor:id",checkAuth, ingresoEgreso.convertJsonToExcelComedor);

module.exports = router;
