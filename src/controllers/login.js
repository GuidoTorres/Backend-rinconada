const {
  usuario,
  rol,
  permisos,
  cargo,
  trabajador,
  trabajador_contrato,
} = require("../../config/db");
const { tokenSign } = require("../helpers/generateToken");
const { compare } = require("../helpers/handleBcrypt");

const authLogin = async (req, res, next) => {
  try {
    const { user, contrasenia } = req.body;
    const get = await usuario.findOne({
      attributes: { exclude: ["usuario_id"] },
      where: { usuario: user },
      include: [
        {
          model: trabajador,
          attributes: ["apellido_paterno", "apellido_materno", "nombre"],
          required:false,
          include: [
            {
              model: trabajador_contrato,
              where: { estado: "activo" },
              attributes: ["id"],
              required:false
            },
          ],
        },
        { model: rol, include: [{ model: permisos }] },
      ],
    });

    console.log(get.rol.permisos);

    if (!get) {
      return res
        .status(404)
        .send({ msg: "Usuario no encontrado!", status: 404 });
    }

    const checkPassword = await compare(contrasenia, get.contrasenia);
    const tokenSession = await tokenSign(get);
    if (get.estado === false) {
      return res.status(500).send({ msg: "Usuario inactivo!", status: 500 });
    }
    
    const tienePermiso = get.rol.permisos.some(permisoObj => {
      const permiso = permisoObj.dataValues;
  
      // Excluimos campos que no son permisos
      const { id, rol_id, ...permisosSinID } = permiso;
  
      // Obtenemos todos los valores de los permisos (true, false, null)
      const valoresPermisos = Object.values(permisosSinID);
  
      // Verificamos si al menos uno es true
      return valoresPermisos.includes(true);
  });

    if (!tienePermiso) {
      return res.status(403).send({ msg: "No tiene permisos suficientes para acceder!", status: 403 });
    }

    if (checkPassword) {
      return res.send({
        data: get,
        tokenSession,
        msg: `Bienvenido ${get.nombre}!`,
        trabajador_contrato_id: get?.trabajador?.trabajador_contratos[0]?.id || null,
        status: 200,
      });
    }

    if (!checkPassword) {
      return res
        .status(409)
        .send({ msg: "Contraseña incorrecta!", status: 409 });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Hubo un error.", status: 500 });
  }
};

module.exports = authLogin;
