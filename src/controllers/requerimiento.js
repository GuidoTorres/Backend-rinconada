const dayjs = require("dayjs");
const {
  requerimiento,
  requerimiento_producto,
  producto,
  area,
  almacen,
  unidad,
  trabajador,
  contrato,
  asociacion,
  requerimiento_pedido,
  trabajador_contrato,
  usuario,
} = require("../../config/db");
const { Op, Sequelize } = require("sequelize");

const getRequerimiento = async (req, res, next) => {
  try {
    const getArea = await area.findAll({});
    const get = await requerimiento.findAll({
      include: [
        { model: almacen },
        { model: requerimiento_pedido },
        {
          model: requerimiento_producto,
          include: [
            {
              model: producto,
              attributes: { exclude: ["categoria_id"] },
              include: [{ model: unidad }],
            },
          ],
        },
      ],
    });

    const formatData = get
      .map((item) => {
        return {
          id: item?.id,
          fecha_pedido: dayjs(item?.fecha_pedido).format("YYYY-MM-DD"),
          fecha_entrega: dayjs(item?.fecha_entrega).format("YYYY-MM-DD"),
          solicitante: item?.solicitante,
          area: item?.area,
          area_id: getArea?.filter((data) => data.nombre === item?.area).at(-1)
            ?.id,
          pedido_id: item.requerimiento_pedidos
            .map((data) => data.pedido_id)
            .toString(),
          celular: item?.celular,
          proyecto: item?.proyecto,
          codigo_requerimiento: item?.codigo_requerimiento,
          almacen_id: item?.almacen_id,
          almacen: item?.almacen?.nombre,
          estado: item?.estado,
          aprobacion_jefe: item?.aprobacion_jefe,
          aprobacion_gerente: item?.aprobacion_gerente,
          aprobacion_superintendente: item?.aprobacion_superintendente,
          completado: item?.completado,
          requerimiento_productos: item?.requerimiento_productos,
          dni: item?.dni,
          firma_jefe: item?.firma_jefe,
          firma_gerente: item?.firma_gerente,
          firma_superintendente: item?.firma_superintendente,
          jefe: item.jefe,
          gerente: item.gerente
        };
      })
      .sort((a, b) => {
        return b.id - a.id;
      });
    return res.status(200).json({ data: formatData });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const postARequerimiento = async (req, res, next) => {
  try {
    const usuarios = await usuario.findAll({
      where: {
        cargo_id: [15, 44]
      }
    });
    let data = {
      dni: req.body.dni,
      codigo: req.body.codigo,
      fecha_pedido: req.body.fecha_pedido,
      fecha_entrega: req.body.fecha_entrega,
      solicitante: req.body.solicitante,
      area: req.body.area,
      celular: req.body.celular,
      proyecto: req.body.proyecto,
      almacen_id: req.body.almacen_id,
      completado: "Pendiente",
      estado: "Pendiente",
      jefe: usuarios[0].nombre,
      gerente: usuarios[1].nombre
    };
    const post = await requerimiento.create(data);

    const productoRequerimiento = req.body.requerimientos.map((item) => {
      return {
        requerimiento_id: post.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
      };
    });

    await requerimiento_producto.bulkCreate(
      productoRequerimiento
    );

    return res
      .status(200)
      .json({ msg: "Requerimiento creado con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updateRequerimiento = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await requerimiento.update(req.body, { where: { id: id } });
    const updateEstado = await requerimiento.findOne({
      where: { id: id },
    });

    if (updateEstado.estado === "Pendiente") {
      if (
        updateEstado.aprobacion_jefe &&
        updateEstado.aprobacion_gerente &&
        updateEstado.aprobacion_superintendente
      ) {
        let update = await requerimiento.update(
          { estado: "Aprobado", completado: "Aprobado" },
          { where: { id: id } }
        );
      } else {
        let update = await requerimiento.update(
          { estado: "Pendiente", completado: "Aprobado" },
          { where: { id: id } }
        );
      }
      return res
        .status(200)
        .json({ msg: "Requerimiento actualizado con éxito!", status: 200 });
    } else {
      return res.status(200).json({
        msg: "El requerimiento ya fue aprobado, no se puede actualizar.",
        status: 200,
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const updateRequerimientoProducto = async (req, res, next) => {
  let id = req.params.id;

  let data = {
    dni: req.body.dni,
    fecha_pedido: req.body.fecha_pedido,
    fecha_entrega: req.body.fecha_entrega,
    solicitante: req.body.solicitante,
    area: req.body.area,
    celular: req.body.celular,
    proyecto: req.body.proyecto,
  };
  try {
    let update = await requerimiento.update(data, {
      where: { id: id },
    });

    const updateRequerimientoProducto = req.body.requerimientos.map((item) => {
      return {
        requerimiento_id: id,
        producto_id: item.codigo_producto,
        cantidad: item.cantidad,
      };
    });

    const delReqProducto = await requerimiento_producto.destroy({
      where: { requerimiento_id: id },
    });

    let updateProducto = await requerimiento_producto.bulkCreate(
      updateRequerimientoProducto,
      {
        ignoreDuplicates: false,
      }
    );

    return res
      .status(200)
      .json({ msg: "Requerimiento actualizado con éxito!", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteRequerimiento = async (req, res, next) => {
  let id = req.params.id;
  try {
    let getReq = await requerimiento.findOne({ where: { id: id } });

    if (getReq.estado === "Pendiente") {
      let delReqProducto = await requerimiento_producto.destroy({
        where: { requerimiento_id: id },
      });
      let camp = await requerimiento.destroy({ where: { id: id } });
      return res
        .status(200)
        .json({ msg: "Requerimiento eliminado con éxito!", status: 200 });
    } else {
      return res
        .status(500)
        .json({ msg: "No se puede eliminar el requerimiento.", status: 500 });
    }
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

const getLastId = async (req, res, next) => {
  try {
    const get = await requerimiento.findOne({
      order: [["id", "DESC"]],
    });

    const getId = get ? get?.id + 1 : 1;
    return res.status(200).json({ data: getId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo obtener", status: 500 });
  }
};

const getTrabajadorRequerimiento = async (req, res, next) => {
  try {
    const getArea = await area.findAll();
    const get = await trabajador.findAll({
      where: {
        deshabilitado: { [Op.not]: true },
      },
      attributes: ["dni", "apellido_paterno", "apellido_materno", "nombre", "telefono"],
      include: [
        {
          model: trabajador_contrato,
          include: [
            {
              model: contrato,
              attributes: [
                "id",
                "gerencia_id",
                "area_id",
                "puesto_id",
                "finalizado",
              ],
              where: {
                suspendido: { [Op.not]: true },
                finalizado: { [Op.not]: true },
              },
            },
          ],
        },
      ],
    });

    const format = get.map((item) => {
      const areaContrato = item?.trabajador_contratos?.at(0)?.contrato?.area_id;
      return {
        dni: item?.dni,
        nombre:
          item?.apellido_paterno +
          " " +
          item?.apellido_materno +
          " " +
          item?.nombre,

          telefono: item?.telefono,
        area: getArea?.filter((data) => data?.id === areaContrato)?.at(-1)?.nombre,
      };
    }).filter(item => item.area);

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getReqTrabajador = async (req, res, next) => {
  try {
    const getArea = await area.findAll();
    const get = await trabajador.findAll({
      where: {
        deshabilitado: { [Op.not]: true },
      },
      attributes: ["dni", "apellido_paterno", "apellido_materno", "nombre", "telefono"],
      include: [
        {
          model: trabajador_contrato,
          include: [
            {
              model: contrato,
              attributes: [
                "id",
                "gerencia_id",
                "area_id",
                "puesto_id",
                "finalizado",
              ],
              where: {
                suspendido: { [Op.not]: true },
                finalizado: { [Op.not]: true },
              },
            },
          ],
        },
      ],
    });

    const format = get.map((item) => {
      const areaContrato = item?.trabajador_contratos?.at(0)?.contrato?.area_id;
      return {
        dni: item?.dni,
        nombre:
          item?.apellido_paterno +
          " " +
          item?.apellido_materno +
          " " +
          item?.nombre,

          telefono: item?.telefono,
        area: getArea?.filter((data) => data?.id === areaContrato)?.at(-1)?.id,
      };
    }).filter(item => item.area);

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

module.exports = {
  getRequerimiento,
  // getRequerimientoById,
  postARequerimiento,
  updateRequerimiento,
  deleteRequerimiento,
  updateRequerimientoProducto,
  getLastId,
  getTrabajadorRequerimiento,
  getReqTrabajador
};
