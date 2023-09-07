const {
  campamento,
  trabajador,
  contrato,
  teletrans,
  pago,
  contrato_pago,
  destino_pago,
  destino,
  trabajador_contrato,
  cargo,
  asociacion,
  contrato_pago_trabajador,
  area,
} = require("../../config/db");
const { Op } = require("sequelize");

// mostrar lista de incentivos
const getIncentivo = async (req, res, next) => {
  try {
    const getPago = await pago.findAll({
      include: [
        {
          model: contrato_pago,
          attributes: { exclude: ["contrato_pago_id"] },
          include: [
            {
              model: contrato_pago_trabajador,
              include: [
                {
                  model: trabajador,
                  attributes: { exclude: ["usuarioId", "trabajador_dni"] },

                  include: [
                    {
                      model: trabajador_contrato,
                      include: [
                        {
                          model: contrato,
                          attributes: { exclude: ["contrato_id"] },
                          where: { finalizado: false },

                          include: [
                            { model: asociacion },
                            { model: area },
                            {
                              model: cargo,
                              attributes: { exclude: ["cargo_id"] },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const filterIncentivo = getPago.filter(
      (item) => item?.tipo === "incentivo"
    );

    const format = filterIncentivo
      .map((item, i) => {
        return {
          pago_id: item?.id,
          teletrans: item?.teletrans,
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          estado: item?.estado,
          tipo: item?.tipo,
          volquetes: item.volquetes,
          trabajadores:
            // nuevo: data?.contrato_pago_trabajadors.map((dat) => dat),
            item?.contrato_pagos.flatMap((data) => {
              return data?.contrato_pago_trabajadors?.map((dat) => {
                return {
                  contrato_id: data?.contrato_id,
                  dni: dat?.trabajador?.dni,
                  volquetes: dat?.volquetes,
                  teletrans: dat?.teletrans,
                  nombre:
                    dat?.trabajador?.apellido_paterno +
                    " " +
                    dat?.trabajador?.apellido_materno +
                    " " +
                    dat?.trabajador?.nombre,
                  telefono: dat?.trabajador?.telefono,
                  area: dat?.trabajador?.trabajador_contratos
                    ?.map((da) => da.contrato.area.nombre)
                    .toString(),
                  cargo:
                    dat?.trabajador?.trabajador_contratos
                      ?.map((da) => da?.contrato?.cargo?.nombre)
                      .toString() !== ""
                      ? dat?.trabajador?.trabajador_contratos
                          ?.map((da) => da?.contrato?.cargo?.nombre)
                          .toString()
                      : dat?.trabajador?.trabajador_contratos
                          ?.map((da) => da?.contrato?.asociacion?.tipo)
                          .toString(),
                };
              });
            }),
        };
      })

      ?.filter((item) => item?.estado === "programado")
      .map((item, i) => {
        return {
          id: i + 1,
          ...item,
        };
      });

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

//mostrar trabajadores para registrar incentivo
const getTrabajadoresIncentivo = async (req, res, next) => {
  try {
    const get = await trabajador.findAll({
      where: {
        [Op.and]: [{ deshabilitado: { [Op.not]: true } }],
      },
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajador_contrato,
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
              where: {
                finalizado: { [Op.not]: true },
              },
            },
          ],
        },
      ],
    });

    const filterContrato = get?.filter(
      (item) => item.trabajador_contratos.length > 0
    );

    const formatData = filterContrato
      ?.map((item, i) => {
        return {
          id: i + 1,
          dni: item?.dni,
          nombre:
            item?.apellido_paterno +
            " " +
            item?.apellido_materno +
            " " +
            item?.nombre,
          celular: item?.telefono,
          contrato_id: item.trabajador_contratos
            .map((item) => item.contrato_id)
            .toString(),
        };
      })
      .filter(
        (item) =>
          item.contrato_id !== null &&
          item.contrato_id !== undefined &&
          item.contrato_id !== ""
      );

    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

// incentivos por id
const getIncentivoById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const camp = await campamento.findAll({ where: { id: id } });
    return res.status(200).json({ data: camp });

    next();
  } catch (error) {
    res.status(500).json(error);
  }
};
// crear incentivo
const postIncentivo = async (req, res, next) => {
  let createPago;
  let updatePago;
  if (req.body.id) {
    updatePago = {
      id: req.body.id,
      observacion: req.body.observacion,
      fecha_pago: req.body.fecha_pago,
      estado: "programado",
      teletrans: req.body.teletrans,
      tipo: req.body.tipo,
    };
  } else {
    createPago = {
      observacion: req.body.observacion,
      fecha_pago: req.body.fecha_pago,
      estado: "programado",
      teletrans: req.body.teletrans,
      tipo: req.body.tipo,
    };
  }

  try {
    if (req.body.contrato_id === undefined && req.body.contrato_id === "") {
      return res.status(400).json({
        msg: "Error! Datos incompletos.",
        status: 400,
      });
    }
    if (parseInt(req.body.teletrans) % 4 !== 0) {
      return res.status(400).json({
        msg: "Error! La cantidad de teletrans debe ser igual a 1 ó mas volquetes.",
        status: 400,
      });
    } else {
      if (createPago) {
        const post = await pago.create(createPago);
        let contra_pago = {
          pago_id: post.id,
          contrato_id: req.body.contrato_id,
          teletrans: req.body.teletrans,
        };
        const pagoContrato = await contrato_pago.create(contra_pago);
      } else {
        const post = await pago.update(updatePago, {
          where: { id: req.body.id },
        });
      }
      return res
        .status(200)
        .json({ msg: "Incentivo registrado con éxito!", status: 200 });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};
// crear un incentivo para multiples trabajadores
const postIncentivoMultiple = async (req, res, next) => {
  let pruebaPago = {
    observacion: "observacion",
    fecha_pago: "2023-02-02",
    estado: false,
    tipo: "incentivo",
    trabajadores: [
      {
        teletrans: 1,
        contrato_id: 10,
      },
      {
        teletrans: 0.5,
        contrato_id: 11,
      },
      {
        teletrans: 1.5,
        contrato_id: 12,
      },
      {
        teletrans: 1,
        contrato_id: 13,
      },
    ],
  };
  const info = {
    observacion: pruebaPago.observacion,
    fecha_pago: pruebaPago.fecha_pago,
    tipo: pruebaPago.tipo,
    estado: false,
  };

  try {
    console.log(req.body);
    // const totalTeletrans = pruebaPago.trabajadores.reduce(
    //   (acc, value) => acc + parseFloat(value.teletrans),
    //   0
    // );

    // if (totalTeletrans === 4) {
    //   const post = await pago.create(createPago);
    //   let contra_pago = pruebaPago.trabajadores.map((item) => {
    //     return {
    //       teletrans: item.teletrans,
    //       contrato_id: item.contrato_id,
    //       pago_id: post.id,
    //     };
    //   });
    //   const pagoContrato = await contrato_pago.create(contra_pago);
    //   return res
    //     .status(200)
    //     .json({ msg: "Incentivo registrado con éxito!", status: 200 });
    // } else {
    //   return res.status(400).json({
    //     msg: "Error! La cantidad de teletrans debe ser equivalente a 1 volquete.",
    //     status: 400,
    //   });
    // }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};
// eliminar incentivo
const deleteIncentivo = async (req, res, next) => {
  let id = req.params.id;
  try {
    const getDestinoPago = await destino_pago.findAll({
      where: { pago_id: id },
    });

    const ids = getDestinoPago.map((item) => item.destino_id);
    let delDestinoPago = await destino_pago.destroy({ where: { pago_id: id } });
    let delDestino = await destino.destroy({ where: { id: ids } });

    // Mover la eliminación de registros de contrato_pago después de eliminar contrato_pago_trabajador
    let delContratoPago = await contrato_pago.destroy({
      where: { pago_id: id },
    });

    let del = await pago.destroy({ where: { id: id } });

    return res
      .status(200)
      .json({ msg: "Incentivo eliminado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  postIncentivo,
  getIncentivo,
  getIncentivoById,
  deleteIncentivo,
  postIncentivoMultiple,
  getTrabajadoresIncentivo,
};
