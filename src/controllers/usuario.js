const { format } = require("path");
const { usuario, permisos, trabajador } = require("../../config/db");
const { encrypt } = require("../helpers/handleBcrypt");
const fs = require("fs");

const getUsuario = async (req, res, next) => {
  try {
    const all = await usuario.findAll();
    const format = all.map((item, i) => {
      return {
        nro: i + 1,
        ...item.dataValues,
      };
    });
    return res.status(200).json({ data: format });
  } catch (error) {
    res.status(500).json();
  }
};

const getUsuarioById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const user = await usuario.findAll({ where: { id: id } });
    return res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json(error);
  }
};

const postUsuario = async (req, res, next) => {
  const { nombre, contrasenia, estado, rol_id, cargo_id, caja } = req.body;
  if (!nombre || !req.body.usuario || !contrasenia) {
    return res.status(400).json({ msg: "Faltan campos requeridos" });
  }
  const passwordHash = await encrypt(contrasenia);
  let info = {
    nombre,
    usuario: req.body.usuario,
    contrasenia: passwordHash,
    estado: estado || true,
    rol_id: rol_id || null,
    cargo_id: cargo_id || null,
    foto: req.file ? process.env.LOCAL_IMAGE + req?.file?.filename : "",
    caja: caja || null,
  };

  try {
    const getUser = await usuario.findAll({
      where: { usuario: info.usuario },
    });

    if (getUser.length > 0) {
      return res.status(409).json({
        msg: "El nombre de usuario ya existe, intente con otro!",
        status: 500,
      });
    } else {
      const nuevoUsuario = await usuario.create(info);
      return res.status(200).json({
        data: nuevoUsuario,
        msg: "Usuario creado con éxito!",
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updateUsuario = async (req, res, next) => {
  let id = req.params.id;

  let info = {
    nombre: req.body.nombre,
    usuario: req.body.usuario,
    estado: Boolean(req.body.estado),
    rol_id: req.body.rol_id || null ,
    cargo_id: req.body.cargo_id || null ,
    caja: req.body.caja,
    foto: req.file
      ? process.env.LOCAL_IMAGE + req.file.filename
      : req.body.foto,
  };
  try {
    if (req?.body?.foto !== undefined && req.body.foto !== "") {
      const fileDir = require("path").resolve(__dirname, `./public/images/`);

      const editFotoLink = req.body.foto.split("/").at(-1);
      fs.unlink("./public/images/" + editFotoLink, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("eliminado con éxito!");
        }
      });
    }
    await usuario.update(info, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Usuario actualizado con éxito!", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar", status: 500 });
  }
};

const deleteUsuario = async (req, res, next) => {
  let id = req.params.id;
  try {
    await trabajador.update(
      { usuario_id: null },
      { where: { usuario_id: id } }
    );
    await usuario.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Usuario eliminado con éxito!", status: 200 });
  } catch (error) {

    res.status(500).json({ msg: "No se pudo eliminar", status: 500 });
  }
};

const getPermiso = async (req, res, next) => {
  let id = req.params.id;

  try {
    const user = await permisos.findAll({
      where: { rol_id: id },
      attributes: { exclude: ["usuario_id"] },
    });
    return res.status(200).json({ data: user });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updatePermisos = async (req, res, next) => {
  let id = req.params.id;

  let info = {
    administracion: req?.body?.administracion,
    administracion_usuario: req?.body?.administracion_usuario,
    administracion_campamento: req?.body?.administracion_campamento,
    administracion_rol: req?.body?.administracion_rol,
    personal: req?.body?.personal,
    personal_trabajador: req?.body?.personal_trabajador,
    personal_grupal: req?.body?.personal_grupal,
    personal_empresa: req?.body?.personal_empresa,
    personal_socio: req?.body?.personal_socio,
    planillas: req?.body?.planillas,
    planillas_asistencia: req?.body?.planillas_asistencia,
    planillas_control: req?.body?.planillas_control,
    logistica: req?.body?.logistica,
    logistica_inventario: req?.body?.logistica_inventario,
    logistica_almacen: req?.body?.logistica_almacen,
    logistica_requerimiento: req?.body?.logistica_requerimiento,
    logistica_aprobacion: req?.body?.logistica_aprobacion,
    logistica_transferencia: req?.body?.logistica_transferencia,
    logistica_categoria: req?.body?.logistica_categoria,
    logistica_estadistica: req?.body?.logistica_estadistica,
    finanzas: req?.body?.finanzas,
    finanzas_ingreso: req?.body?.finanzas_ingreso,
    finanzas_proveedor: req?.body?.finanzas_proveedor,
    finanzas_sucursal: req?.body?.finanzas_sucursal,
    personal_contrato: req?.body?.personal_contrato,
    personal_evaluacion: req?.body?.personal_evaluacion,
    personal_trapiche: req?.body?.personal_trapiche,
    personal_volquete: req?.body?.personal_volquete,
    planillas_programacion: req?.body?.planillas_programacion,
    planillas_realizar_pagos: req?.body?.planillas_realizar_pagos,
    planillas_historial: req?.body?.planillas_historial,
    planillas_incentivos: req?.body?.planillas_incentivos,
    planillas_casa: req?.body?.planillas_casa,
    planillas_asociacion: req?.body?.planillas_asociacion,
    planillas_aprobacion: req?.body?.planillas_aprobacion,
    logistica_aprobacion_jefe: req?.body?.logistica_aprobacion_jefe,
    logistica_aprobacion_gerente: req?.body?.logistica_aprobacion_gerente,
    logistica_aprobacion_superintendente:
      req?.body?.logistica_aprobacion_superintendente,
    seguridad: req?.body?.seguridad,
    seguridad_incidentes: req?.body?.seguridad_incidentes,
  };
  try {
    let user = await permisos.update(info, { where: { rol_id: id } });
    return res
      .status(200)
      .json({ msg: "Permisos actualizados con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};
const changePassword = async (req, res, next) => {
  let id = req.params.id;
  try {
    const { contrasenia } = req.body;
    const passwordHash = await encrypt(contrasenia);
    let user = await usuario.update(
      { contrasenia: passwordHash },
      { where: { id: id } }
    );
    return res
      .status(200)
      .json({ msg: "Contraseña actualizada con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar", status: 500 });
  }
};

const crearUsuariosDesdeTrabajadores = async (req, res) => {
  try {
    const trabajadoresSinUsuario = await trabajador.findAll({
      attributes: { exclude: ["usuarioId"] },
      where: { usuario_id: null }, // Asumiendo que 'usuarioId' es una FK en trabajador que apunta a usuario
    });

    const usuariosCreados = [];

    for (let trabajador of trabajadoresSinUsuario) {
      // Encriptar la contraseña
      const passwordHash = await encrypt(trabajador.dni);
      const nuevoUsuario = await usuario.create({
        nombre: trabajador.nombre,
        usuario: trabajador.dni,
        contrasenia: passwordHash,
        estado: true,
        rol_id: 64, // Ajusta esto si tienes un rol específico
      });

      trabajador.usuario_id = nuevoUsuario.id;
      await trabajador.save();

      usuariosCreados.push(nuevoUsuario);
    }

    res.status(201).json({
      message: "Usuarios creados exitosamente",
      usuarios: usuariosCreados,
    });
  } catch (error) {
    console.error("Hubo un error al crear usuarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  postUsuario,
  getUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuarioById,
  updatePermisos,
  getPermiso,
  changePassword,
  crearUsuariosDesdeTrabajadores,
};
