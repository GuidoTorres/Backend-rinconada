const router = require("express").Router();
const usuario = require("../controllers/usuario");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");
const images = require("../middleware/multerImage");

const getUsuario = usuario.getUsuario;
const postUsuario = usuario.postUsuario;
const updateUsuario = usuario.updateUsuario;

router.get("/", getUsuario);
router.get("/:id", usuario.getUsuarioById);
router.get("/permiso/:id", usuario.getPermiso);
router.get("/crear/trabajador", usuario.crearUsuariosDesdeTrabajadores)
router.post("/", images(), postUsuario);
router.put("/:id", images(), updateUsuario);
router.put("/contrasenia/:id", usuario.changePassword);
router.put("/permisos/:id", usuario.updatePermisos);
router.delete("/:id", usuario.deleteUsuario);
module.exports = router;
