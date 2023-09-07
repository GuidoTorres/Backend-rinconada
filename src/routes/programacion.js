const router = require("express").Router();
const programacion = require("../controllers/programacionPago");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, programacion.getAprobacion)
// router.get("/:id", rol.getRolById)
// router.post("/", rol.postRol)
// router.put("/:id", rol.updateRol)
// router.delete("/:id", rol.deleteRol)
module.exports = router