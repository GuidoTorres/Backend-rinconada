const { usuario, rol, permisos } = require("../../config/db");
// const cargo = require("../models/cargo");

const getRol = async (req, res, next) => {
  try {
    const all = await rol.findAll({
      include: [{ model: permisos }],
    });

    return res.status(200).json({ data: all });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const getRolById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const rolByID = await rol.findAll({ where: { id: id } });
    return res.status(200).json({ data: rolByID });

  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const postRol = async (req, res, next) => {
  let info = {
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
  };

  try {
    const createRol = await rol.create(info);
    if (createRol) {
      let accesos = {
        administracion: false,
        administracion_usuario: false,
        administracion_campamento: false,
        personal: false,
        personal_trabajador: false,
        personal_grupal: false,
        personal_empresa: false,
        personal_socio: false,
        planillas: false,
        planillas_asistencia: false,
        planillas_control: false,
        logistica: false,
        logistica_inventario: false,
        logistica_almacen: false,
        logistica_requerimiento: false,
        logistica_aprobacion: false,
        logistica_transferencia: false,
        logistica_categoria: false,
        logistica_estadistica: false,
        finanzas: false,
        finanzas_ingreso: false,
        finanzas_proveedor: false,
        finanzas_sucursal: false,
        rol_id: createRol.id,
        personal_contrato: false,
        personal_evaluacion: false
      };
      const agregarPermisos = await permisos.create(accesos);
      return res.status(200).json({ msg: "Rol creado con éxito!", status: 200 });
    }

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear", status: 500 });
  }
};

const updateRol = async (req, res, next) => {
  let id = req.params.id;

  try {
    let upRol = await rol.update(req.body, { where: { id: id } });
    return res.status(200).json({ msg: "Rol actualizado con éxito!", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteRol = async (req, res, next) => {
  let id = req.params.id;
  try {
    let delPermiso = await permisos.destroy({ where: { rol_id: id } });
    let delRol = await rol.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Rol eliminado con éxito!", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = { getRol, getRolById, updateRol, deleteRol, postRol };
