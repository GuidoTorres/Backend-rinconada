const router = require("express").Router();
const saldo = require("../controllers/saldo");
const checkAuth = require("../middleware/auth");



router.get("/",checkAuth, saldo.getSaldo)
router.get("/:id",checkAuth, saldo.getSaldoById)
// router.post("/", rol.postRol)
// router.put("/:id", rol.updateRol)
// router.delete("/:id", rol.deleteRol)
module.exports = router