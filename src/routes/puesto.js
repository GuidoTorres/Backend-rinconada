const router = require("express").Router();
const puesto = require("../controllers/puesto");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, puesto.getPuesto)
// router.get("/:id", rol.getRolById)
// router.post("/", rol.postRol)
// router.put("/:id", rol.updateRol)
// router.delete("/:id", rol.deleteRol)
module.exports = router