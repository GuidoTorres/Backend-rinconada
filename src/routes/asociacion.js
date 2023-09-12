const router = require("express").Router();
const asociacion = require("../controllers/asociacion");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");
const uploadFile = require("../middleware/multerAsociacion")

router.get("/",  asociacion.getAsociacion);
router.post("/",checkAuth,checkAuditoria, asociacion.postAsociacion);
router.post("/upload/:id",checkAuth, uploadFile(),checkAuditoria, asociacion.uploadFile);
router.get("/:id",checkAuth, asociacion.getAsociacionById);
router.put("/:id",checkAuth,checkAuditoria, asociacion.updateAsociacion);
router.delete("/:id",checkAuth,checkAuditoria, asociacion.deleteAsociacion);
module.exports = router;
