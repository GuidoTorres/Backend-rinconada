const express = require("express");
const trabajador = require("../controllers/trabajador");
const router = require("express").Router();
const images = require("../middleware/multerImage")
const multer = require("../middleware/multer");
const checkAuth = require("../middleware/auth");
const checkAuditoria = require("../middleware/auditoria");

router.get("/", trabajador.getTrabajador);
router.get("/contrato", trabajador.getTrabajadorConContrato)
router.get("/lista", trabajador.getListaTrabajadoreSelect)
router.get("/:id", trabajador.getTrabajarById);
router.get("/aprobado",checkAuth, trabajador.getTrabajadorPagoAprobado);
router.get("/last/id",checkAuth, trabajador.getLastId);
router.get("/contrato/suspendido/:id", trabajador.getContratoSuspendidoById)
router.post("/bulk",checkAuth, multer(), checkAuditoria,trabajador.postMultipleTrabajador);
router.post("/",checkAuth, images(), checkAuditoria,trabajador.postTrabajador);
router.put("/:id",checkAuth, images(),checkAuditoria, trabajador.updateTrabajador);
router.delete("/:id",checkAuth,checkAuditoria, trabajador.deleteTrabajador);
router.put("/softdelete/:id",checkAuth,checkAuditoria, trabajador.softDeleteTrabajador);
module.exports = router;
