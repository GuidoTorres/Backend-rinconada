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
router.get("/aprobado", trabajador.getTrabajadorPagoAprobado);
router.get("/last/id", trabajador.getLastId);
router.get("/contrato/suspendido/:id", trabajador.getContratoSuspendidoById)
router.post("/bulk", multer(), trabajador.postMultipleTrabajador);
router.post("/", images(), trabajador.postTrabajador);
router.put("/:id", images(), trabajador.updateTrabajador);
router.delete("/:id", trabajador.deleteTrabajador);
router.put("/softdelete/:id", trabajador.softDeleteTrabajador);
module.exports = router;
