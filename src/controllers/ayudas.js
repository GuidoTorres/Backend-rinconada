const {
  trabajador,
  contrato_pago,
  pago,
  ayuda_pago,
  teletrans,
  destino,
  destino_pago,
} = require("../../config/db");

// la ayuda se refiere al pago extraordinario, al inicio lo entendi como ayuda, por lo que en la bd los pagos extraordinarios
// estan en la tabla ayuda_pago


const getTrabajadorAyuda = async (req, res, next) => {
  try {
    const all = await trabajador.findAll({
      attributes: { exclude: ["usuarioId"] },
    });
    const formatData = all.map((item) => {
      return {
        dni: item.dni,
        codigo_trabajador: item.codigo_trabajador,
        nombre:
          item.nombre +
          " " +
          item.apellido_paterno +
          " " +
          item.apellido_materno,
      };
    });
    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getAyuda = async (req, res, next) => {
  try {
    const get = await ayuda_pago.findAll({
      include: [
        {
          model: pago,
          where: { tipo: "extraordinario" },
          include: [{ model: destino_pago, include: [{ model: destino }] }],
        },
        {
          model: trabajador,
          attributes: { exclude: ["usuarioId"] },
        },
      ],
    });

    // const formatData = get
    //   .map((item) => {
    //     return {
    //       id: item?.id,
    //       dni: item.trabajador_dni,
    //       pago_id: item?.pago_id,
    //       teletrans: item?.teletrans,
    //       nombre:
    //         item.trabajador.nombre +
    //         " " +
    //         item.trabajador.apellido_paterno +
    //         " " +
    //         item.trabajador.apellido_materno,
    //       pago: item.pago,
    //     };
    //   })
    //   .filter((item) => Object.keys(item.pago).length > 0);

    return res.status(200).json({ data: get });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error });
  }
};

const postPagoExtraordinario = async (req, res, next) => {
  try {
    let infoProgramacion = {
      observacion: req.body.observacion,
      fecha_pago: req.body.fecha_pago,
      estado: "completado",
      teletrans: req.body.teletrans,
      tipo: req.body.tipo,
      trabajador_dni: req.body.trabajador_dni,
      volquetes: req.body.volquetes,
    };
    {
      const post = await pago.create(infoProgramacion);
      let contra_pago = {
        pago_id: post.id,
        trabajador_dni: req.body.trabajador_dni,
        teletrans: req.body.teletrans,
      };
      const pagoContrato = await ayuda_pago.create(contra_pago);

      const create = await destino.bulkCreate(req.body.destino);

      console.log(create);
      const formatDestinoIds = create.map((item) => {
        return {
          destino_id: item.id,
          pago_id: post.id,
          estado: "completado",
        };
      });

      const pagoDestino = await destino_pago.bulkCreate(formatDestinoIds);
    }

    return res
      .status(200)
      .json({ msg: "Pago registrado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo registrar.", status: 500 });
  }
};

const updateProgramacionAyuda = async (req, res, next) => {
  let id = req.params.id;
  let info = {
    observacion: req.body.observacion,
    fecha_pago: req.body.fecha_pago,
    teletrans: req.body.teletrans,
  };
  try {
    if (info.teletrans % 4 === 0) {
      let update = await pago.update(info, { where: { id: id } });
      let data = {
        teletrans: info.teletrans,
      };
      let updateContatoPago = await ayuda_pago.update(data, {
        where: { pago_id: id },
      });

      return res
        .status(200)
        .json({ msg: "Programación actualizada con éxito!", status: 200 });
    } else {
      return res.status(400).json({
        msg: "Error! La cantidad de teletrans debe ser equivalente a 1 o mas volquetes.",
        status: 400,
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deletePagoAyuda = async (req, res, next) => {
  let id = req.params.id;
  try {
    const getDestinoPago = await destino_pago.findAll({
      where: { pago_id: id },
    });

    const ids = getDestinoPago.map((item) => item.destino_id);
    let delDestinoPago = await destino_pago.destroy({ where: { pago_id: id } });
    let delDestino = await destino.destroy({ where: { id: ids } });
    let delAyudaPago = await ayuda_pago.destroy({
      where: { pago_id: id },
    });
    let delContratoPago = await contrato_pago.destroy({
      where: { pago_id: id },
    });
    let del = await pago.destroy({ where: { id: id } });
    if (delContratoPago === 0 && del === 0) {
      return res
        .status(404)
        .json({ msg: "No se encontró el pago.", status: 404 });
    } else {
      return res
        .status(200)
        .json({ msg: "Pago eliminado con éxito!", status: 200 });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};
module.exports = {
  getTrabajadorAyuda,
  updateProgramacionAyuda,
  deletePagoAyuda,
  getAyuda,
  postPagoExtraordinario,
};
