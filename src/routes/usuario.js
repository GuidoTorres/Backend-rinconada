const router = require("express").Router();
const usuario = require("../controllers/usuario");
const checkAuditoria = require("../middleware/auditoria");
const checkAuth = require("../middleware/auth");
const images = require("../middleware/multerImage");

const getUsuario = usuario.getUsuario;
const postUsuario = usuario.postUsuario;
const updateUsuario = usuario.updateUsuario;

router.get("/",checkAuth, getUsuario);
router.get("/:id",checkAuth, usuario.getUsuarioById);
router.get("/permiso/:id",checkAuth, usuario.getPermiso);
router.get("/crear/trabajador", usuario.crearUsuariosDesdeTrabajadores)
router.post("/",checkAuth, images(),checkAuditoria, postUsuario);
router.put("/:id",checkAuth, images(),checkAuditoria, updateUsuario);
router.put("/contrasenia/:id",checkAuth,checkAuditoria, usuario.changePassword);
router.put("/permisos/:id",checkAuth,checkAuditoria, usuario.updatePermisos);
router.delete("/:id",checkAuth,checkAuditoria, usuario.deleteUsuario);
module.exports = router;
