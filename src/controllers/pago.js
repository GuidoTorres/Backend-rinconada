const dayjs = require("dayjs");
const { Op } = require("sequelize");
const {
  pago,
  contrato,
  teletrans,
  evaluacion,
  trabajador,
  asociacion,
  empresa,
  destino,
  destino_pago,
  trabajadorAsistencia,
  asistencia,
  trabajador_contrato,
  cargo,
  area,
  sequelize,
  aprobacion_contrato_pago,
  detalle_pago,
} = require("../../config/db");

const createProgramacion = async (req, res, next) => {
  let info = {
    observacion: req.body.observacion,
    fecha_pago: req.body.fecha_pago,
    estado: "programado",
    teletrans: req.body.teletrans,
    tipo: req.body.tipo,
  };

  try {
    if (req.body.contrato_id) {
      if (parseInt(info.teletrans) % 4 !== 0) {
        return res.status(400).json({
          msg: "Error! La cantidad de teletrans debe ser equivalente a un volquete.",
          status: 400,
        });
      } else {
        const post = await pago.create(info);
        let contra_pago = {
          teletrans: info.teletrans,
          contrato_id: req.body.contrato_id,
          pago_id: post.id,
        };
        const pagoContrato = await contrato_pago.create(contra_pago);
        return res
          .status(200)
          .json({ msg: "Programación registrada con éxito!", status: 200 });
      }
    } else {
      return res.status(400).json({
        msg: "Error! Falta el id del contrato.",
        status: 400,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo registrar.", status: 500 });
  }
};

const createProgramacionMultiple = async (req, res, next) => {
  const info = {
    volquetes: req?.body?.volquetes,
    teletrans: req?.body?.teletrans,
    tipo_pago: req?.body?.tipo_pago,
    observacion: req?.body?.observacion,
    unidad_produccion: req.body.unidad_produccion,
    fecha_pago: req?.body?.fecha_pago,
    estado: "programado",
    validacion: false,
  };

  try {

    if (req?.body?.trabajadores?.length > 0) {
      const post = await pago.create(info);
      let contra_pago = req.body.trabajadores.map((item) => {
        return {
          pago_id: post.id,
          trabajador_contrato_id: item.trabajador_contrato_id,
          monto: item.monto,
          quincena: item.quincena
        };
      });
      await detalle_pago.bulkCreate(contra_pago);

      return res
        .status(200)
        .json({ msg: "Programación registrada con éxito!", status: 200 });
    }

    //=====================================
    if (req?.body?.asociacion?.length > 0) {
      const post = await pago.create(info);
      let contra_pago = {
        contrato_id: req.body.contrato_id,
        pago_id: post.id,
        volquetes: req.body.volquetes,
        teletrans: req.body.teletrans,
        quincena: req.body.quincena,
      };
      console.log(contra_pago);

      console.log(req.body);
      let asociacionPago = req.body.asociacion.map((item) => {
        return {
          volquetes: item.volquetes,
          teletrans: item.teletrans,
          trabajador_dni: item.trabajador_dni,
          contrato_pago_id: pagoContrato.id,
          quincena: item.quincena,
        };
      });
      const asociPago = await pago_asociacion.bulkCreate(asociacionPago, {
        ignoreDuplicates: false,
      });
      return res
        .status(200)
        .json({ msg: "Programación registrada con éxito!", status: 200 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updateProgramacion = async (req, res, next) => {
  let id = req.params.id;
  let info = {
    observacion: req.body.observacion,
    fecha_pago: req.body.fecha_pago,
    contrato_id: req.body.contrato_id,
    teletrans: req.body.teletrans,
  };
  try {
    if (info.teletrans % 4 === 0) {
      let updatePAgo = await pago.update(info, { where: { id: id } });
      let data = {
        teletrans: info.teletrans,
      };
      let updateContratoPago = await contrato_pago.update(data, {
        where: { pago_id: id },
      });
      return res
        .status(200)
        .json({ msg: "Programación actualizada con éxito!", status: 200 });
      next();
    } else {
      return res.status(400).json({
        msg: "Error! La cantidad de teletrans debe ser equivalente a 1 o mas volquetes.",
        status: 400,
      });
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const updateProgramacionMultiple = async (req, res, next) => {
  let pago_id = req.params.id;
  const totalTeletrans = req?.body?.trabajadores?.reduce(
    (acc, value) => acc + parseFloat(value.teletrans),
    0
  );
  let info = {
    observacion: req.body.observacion,
    fecha_pago: req.body.fecha_pago,
    contrato_id: req.body.contrato_id,
    teletrans: totalTeletrans || req.body.teletrans,
  };
  try {
    if (!req.body.trabajadores) {
      let update = await pago.update(info, { where: { id: pago_id } });
      let data = {
        teletrans: info.teletrans,
      };
      let updateContratoPago = await contrato_pago.update(data, {
        where: { pago_id: pago_id },
      });

      return res
        .status(200)
        .json({ msg: "Programación actualizada con éxito!", status: 200 });
    }

    if (req?.body?.trabajadores?.length > 1) {
      let update = await pago.update(info, { where: { id: pago_id } });

      let contra_pago = req.body.trabajadores.map((item) => {
        return {
          teletrans: item.teletrans,
          contrato_id: item.contrato_id,
          pago_id: pago_id,
          trabajador_dni: item.trabajador_dni,
        };
      });
      const delPagoContrato = await contrato_pago.destroy({
        where: { pago_id: pago_id },
      });
      const pagoContrato = await contrato_pago.bulkCreate(contra_pago);
      return res
        .status(200)
        .json({ msg: "Programación actualizada con éxito!", status: 200 });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

//para realizar el pago de trabajadores individuales, actualizar el saldo en la tabla teletrans
const postPago = async (req, res, next) => {
  let info = {
    hora: req?.body?.hora,
    placa: req?.body?.placa,
    propietario: req?.body?.propietario,
    trapiche: req.body?.trapiche,
    teletrans: parseInt(req.body?.teletrans),
    contrato_id: parseInt(req.body?.contrato_id),
    pago_id: parseInt(req.body.pago_id),
  };
  let estadoContrato = {
    finalizado: "completado",
  };
  try {
    const saldo = await teletrans.findAll({
      raw: true,
      where: { contrato_id: info.contrato_id },
    });
    saldoResultado = parseInt(saldo?.at(-1)?.saldo) - parseInt(info?.teletrans);

    let newSaldo = {
      saldo: saldoResultado,
    };
    if (saldoResultado < 0) {
      return res.status(200).json({
        msg: "Error! la cantidad a pagar es mayor que el saldo adeudado al trabajador.",
        status: 200,
      });
    }
    if (req.body.teletrans === 4) {
      if (saldoResultado === 0) {
        const create = await destino.create(info);

        const data = {
          destino_id: create.id,
          pago_id: info.pago_id,
          estado: "completado",
        };

        const pagoEstado = {
          estado: "completado",
        };

        const updateEstado = await pago.update(pagoEstado, {
          where: { id: req.body.pago_id },
        });
        console.log(updateEstado);

        const pagoDestino = await destino_pago.create(data);
        //actualiza el saldo
        const updateTeletrans = await teletrans.update(newSaldo, {
          where: { contrato_id: req.body.contrato_id },
        });
        //finaliza el contrato si el saldo llega a 0
        const updateContrato = await contrato.update(estadoContrato, {
          where: { id: req.body.contrato_id },
        });

        //finaliza la evalucacion si el saldo llega a 0
        const updateEvaluacion = await evaluacion.update(estadoContrato, {
          where: { id: req.body[req.body.length - 1]?.evaluacion_id },
        });
        return res
          .status(200)
          .json({ msg: "Pago registrado con éxito!", status: 200 });
      } else {
        const create = await destino.create(info);
        const data = {
          destino_id: create.id,
          pago_id: info.pago_id,
        };
        const pagoDestino = await destino_pago.create(data);
        const pagoEstado = {
          estado: "completado",
        };

        const updateEstado = await pago.update(pagoEstado, {
          where: { id: req.body.pago_id },
        });
        const updateTeletrans = await teletrans.update(newSaldo, {
          where: { contrato_id: info.contrato_id },
        });
        return res
          .status(200)
          .json({ msg: "Pago registrado con éxito!", status: 200 });
      }
    } else {
      return res.status(200).json({
        msg: "Error! el pago solamente se puede realizar si los teletrans equivalen a 1 o más volquetes.",
        status: 200,
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo registrar.", status: 500 });
  }
};
//para realizar el pago de multiples trabajadores, actualizar el saldo en la tabla teletrans

const postMultiplePagos = async (req, res, next) => {
  let estadoContrato = {
    finalizado: true,
  };

  let info = {
    pago_id: req?.body?.pago_id,
    hora: req?.body?.hora,
    placa: req?.body?.placa,
    propietario: req?.body?.propietario,
    trapiche: req?.body?.trapiche,
    teletrans: req?.body?.teletrans,
    asociacion_id: req.body.asociacion_id,
  };

  //ids de contrato de trabajadores
  const ids = req?.body?.trabajadores?.map((item) => item.contrato_id);
  try {
    const saldo = await teletrans.findAll({
      raw: true,
      where: { contrato_id: ids },
    });

    const totalTeletrans = saldo.map((item) => {
      return {
        id: item.id,
        contrato_id: item.contrato_id,
        saldo: parseFloat(item.saldo),
      };
    });

    // el resultado de restar el saldo de tabla teletrasn - los teletrans a pagar
    let result = totalTeletrans.map((item) => {
      const resta = req.body.trabajadores.find(
        (el) => el.contrato_id === item.contrato_id
      );
      if (resta) {
        return {
          ...item,
          saldo: parseFloat(item.saldo) - parseFloat(resta.teletrans),
        };
      } else {
        return item;
      }
    });

    const filterContratoTerminado = result.filter((item) => item.saldo === 0);
    // suma de los ttrans para validar si es un volquete
    const ttransTotal = req?.body?.trabajadores.reduce((acc, value) => {
      return parseFloat(acc.teletrans) + parseFloat(value.teletrans);
    });

    if (ttransTotal === 4) {
      const create = await destino.create(info);

      const data = {
        destino_id: create.id,
        pago_id: info.pago_id,
        estado: "completado",
      };
      const pagoEstado = {
        estado: "completado",
      };
      const pagoDestino = await destino_pago.create(data);
      const updatePago = await pago.update(pagoEstado, {
        where: {
          id: info.pago_id,
        },
      });

      const updateTeletrans = result.map(
        async (item) =>
          await teletrans.update(
            { saldo: item.saldo },
            {
              where: { id: item.id },
            }
          )
      );

      if (filterContratoTerminado.length > 0) {
        // revisar que cambie el estado del contrato, ademas validar que no se pague mas de lo que se debe
        const idsContratos = filterContratoTerminado.map(
          (item) => item.contrato_id
        );
        const updateContrato = await contrato.update(estadoContrato, {
          where: { id: idsContratos },
        });
        // const updateEvaluacion = await evaluacion.update(estadoContrato, {
        //   where: { id: req.body[req.body.length - 1]?.evaluacion_id },
        // });
      }
    } else {
      return res.status(400).json({
        msg: "Error! el monto a pagar debe ser equivalente a 1 volquete.",
        status: 400,
      });
    }

    return res
      .status(200)
      .json({ msg: "Pago realizado con éxito!", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo registrar.", status: 500 });
  }
};

//para mostrar en el calendario las fechas programadas de los pagos
const getPagoFecha = async (req, res, next) => {
  let fecha = req.query.fecha;
  try {
    const get = await pago.findAll({
      where: { fecha_pago: fecha },
      include: [
        {
          model: detalle_pago,
          include: [
            {
              model: trabajador_contrato,
              include: [
                { model: trabajador, attributes: { exclude: ["usuarioId"] } },
                { model: contrato, attributes: { exclude: ["contrato_id"] } },
              ],
            },
          ],
        },
      ],
    });
    return res.status(200).json({ data: get });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo obtener.", status: 500 });
  }
};

//historial de pagos
const historialProgramacion = async (req, res, next) => {
  try {
    const getAsociacion = await asociacion.findAll({});
    const getPago = await pago.findAll({
      where: { [Op.or]: [{ estado: "pagado" }, { estado: "completado" }] },
      include: [
        { model: destino_pago, include: [{ model: destino }] },
        {
          model: contrato_pago,
          attributes: { exclude: ["contrato_pago_id"] },
          include: [
            {
              model: contrato,
              attributes: ["id", "gerencia_id", "area_id", "puesto_id"],
              include: [{ model: aprobacion_contrato_pago }],
            },
            {
              model: pago_asociacion,
              include: [
                {
                  model: trabajador,
                  attributes: [
                    "nombre",
                    "telefono",
                    "dni",
                    "apellido_materno",
                    "apellido_paterno",
                  ],
                },
              ],
            },
            {
              model: contrato_pago_trabajador,
              include: [
                {
                  model: trabajador,
                  attributes: [
                    "nombre",
                    "apellido_paterno",
                    "apellido_materno",
                    "telefono",
                    "dni",
                  ],

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
                          ],
                          include: [
                            { model: aprobacion_contrato_pago },
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
            {
              model: contrato,
              attributes: ["id", "gerencia_id", "area_id", "puesto_id"],
              include: [
                { model: aprobacion_contrato_pago },
                { model: empresa },
              ],
            },
          ],
        },
        {
          model: ayuda_pago,
          include: [
            {
              model: trabajador,
              attributes: [
                "nombre",
                "telefono",
                "dni",
                "apellido_materno",
                "apellido_paterno",
              ],
            },
          ],
        },
      ],
    });

    const formatAsociacion = getPago
      .filter(
        (item) => item?.contrato_pagos?.at(-1)?.pago_asociacions?.length > 0
      )
      .map((item) => {
        return {
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          tipo: item?.tipo,
          estado: item?.estado,
          volquetes: item?.volquetes,
          teletrans: item?.teletrans,
          destino: item?.destino_pagos,
          quincena: item?.quincena,
          unidad_produccion: item?.unidad_produccion,
          pago_id: item.contrato_pagos.map((data) => data.pago_id).toString(),
          pagos: item?.contrato_pagos
            ?.map((data) => {
              const aprobacionData =
                data?.contrato?.aprobacion_contrato_pagos.find(
                  (ele) => ele?.subarray_id == data?.quincena
                );
              const asociacion = getAsociacion?.find(
                (ele) => ele?.id == aprobacionData?.asociacion_id
              );
              return {
                contrato_id: data?.contrato_id,
                pago_id: data?.pago_id,
                asociacion_id: asociacion?.id,
                nombre: asociacion?.nombre,
                tipo_asociacion: asociacion?.tipo,
                area: "---",
                cargo: "---",
                celular: "---",
                dni: "---",
                trabajadores: data?.pago_asociacions.map((dat) => {
                  return {
                    fecha_quincena:
                      aprobacionData?.fecha_inicio +
                      " al " +
                      aprobacionData?.fecha_fin,
                    contrato_id: data?.contrato_id,
                    volquetes: dat?.volquetes,
                    teletrans: dat?.teletrans,
                    dni: dat?.trabajador?.dni,
                    telefono: dat?.trabajador?.telefono,
                    nombre:
                      dat?.trabajador?.apellido_paterno +
                      " " +
                      dat?.trabajador?.apellido_paterno +
                      " " +
                      dat?.trabajador?.apellido_materno,
                  };
                }),
              };
            })
            .at(-1),
        };
      })
      .filter((item) => item.tipo === "asociacion");

    const formatPagoNormal = getPago
      .filter(
        (item) =>
          item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
          item.contrato_pagos.length > 0
      )
      .map((item) => {
        const trabajadores = item?.contrato_pagos?.flatMap((data) => {
          const aprobaciones =
            data?.contrato?.aprobacion_contrato_pagos?.filter(
              (aprobacion) =>
              aprobacion?.contrato_id === data?.contrato_id &&
                aprobacion?.subarray_id === data?.quincena
            );

          return aprobaciones.flatMap((aprobacionData) =>
            data?.contrato_pago_trabajadors?.map((dat) => {
              const cargos = dat?.trabajador?.trabajador_contratos?.filter(
                (ele) => data?.contrato_id == aprobacionData?.contrato_id
              );
              return {
                contrato_id: data?.contrato_id,
                fecha_quincena:
                  aprobacionData?.fecha_inicio + " al " + aprobacionData?.fecha_fin,
                quincena: aprobacionData?.subarray_id,
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
                area: cargos?.contrato?.area?.nombre,
                cargo: cargos?.contrato?.cargo?.nombre,
              };
            })
          );
        });

        return {
          pago_id: item?.id,
          teletrans: item?.teletrans,
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          estado: item?.estado,
          tipo: item?.tipo,
          destino: item?.destino_pagos,
          volquetes: item.volquetes,
          unidad_produccion: item?.unidad_produccion,
          pagos: {
            trabajadores,
          },
        };
      })
      .filter((item) => item.tipo === "pago");

    const formatPagoIncentivo = getPago
      .filter(
        (item) =>
          item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
          item.contrato_pagos.length > 0
      )
      .map((item) => {
        return {
          pago_id: item?.id,
          teletrans: item?.teletrans,
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          estado: item?.estado,
          tipo: item?.tipo,
          destino: item?.destino_pagos,
          volquetes: item.volquetes,
          unidad_produccion: item?.unidad_produccion,

          pagos: {
            trabajadores: item?.contrato_pagos.flatMap((data) => {
              return data?.contrato_pago_trabajadors?.map((dat) => {
                const cargos = dat?.trabajador?.trabajador_contratos.find(
                  (ele) => ele.contrato_id == data.contrato_id
                );
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
                  area: cargos?.contrato?.area?.nombre,
                  cargo: cargos?.contrato?.cargo?.nombre,
                };
              });
            }),
          },
        };
      })
      .filter((item) => item.tipo === "incentivo");

    const formatPagoCasa = getPago
      .filter(
        (item) =>
          item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
          item.contrato_pagos.length > 0
      )
      .map((item) => {
        return {
          pago_id: item?.id,
          teletrans: item?.teletrans,
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          estado: item?.estado,
          tipo: item?.tipo,
          destino: item?.destino_pagos,
          unidad_produccion: item?.unidad_produccion,

          volquetes: item.volquetes,
          pagos: item?.contrato_pagos
            .map((data) => {
              return {
                trabajadores: [
                  {
                    contrato_id: data?.contrato_id,
                    dni: "-----",
                    volquetes: data?.volquetes,
                    teletrans: data?.teletrans,
                    nombre: data?.contrato?.empresa?.razon_social,
                    ruc: data?.contrato?.empresa?.ruc,
                  },
                ],
              };
            })
            .at(-1),
        };
      })
      .filter((item) => item.tipo === "casa");

    const concatData = formatAsociacion.concat(formatPagoNormal);
    const concat2 = concatData.concat(formatPagoCasa);
    const concat3 = concat2
      .concat(formatPagoIncentivo)
      .filter((item) => item.estado !== "programado");
    return res.status(200).json({ data: concat3 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo obtener.", status: 500 });
  }
};

const deletePago = async (req, res, next) => {
  let id = req.params.id;
  try {
    await sequelize.transaction(async (t) => {
      const getDestinoPago = await destino_pago.findAll({
        where: { pago_id: id },
      });

      const getContratoPago = await contrato_pago.findAll({
        where: { pago_id: id },
        attributes: { exclude: ["contrato_pago_id"] },
      });

      const ids = getDestinoPago.map((item) => item.destino_id);
      const idsContratoPago = getContratoPago.map((item) => item.id);

      let delDestinoPago = await destino_pago.destroy({
        where: { pago_id: id },
        transaction: t,
      });

      let delDestino = await destino.destroy({
        where: { id: ids },
        transaction: t,
      });

      // Elimina las filas en la tabla contrato_pago_trabajador antes de eliminar las filas de contrato_pago
      await contrato_pago_trabajador.destroy({
        where: { contrato_pago_id: idsContratoPago },
        transaction: t,
      });

      // Elimina las filas de la tabla pago_asociacion antes de eliminar las filas de contrato_pago
      await pago_asociacion.destroy({
        where: { contrato_pago_id: idsContratoPago },
        transaction: t,
      });

      // Ahora puedes eliminar las filas de la tabla contrato_pago
      let delContratoPago = await contrato_pago.destroy({
        where: { pago_id: id },
        transaction: t,
      });

      let del = await pago.destroy({ where: { id: id }, transaction: t });
    });

    return res
      .status(200)
      .json({ msg: "Pago eliminado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

const validacionPago = async (req, res, next) => {
  let id = req.params.id;
  let updateEstado = {
    estado: "pagado",
  };
  try {
    await sequelize.transaction(async (t) => {
      const updaPago = await pago.update(updateEstado, {
        where: { id: id },
        transaction: t, // Agrega la transacción aquí
      });

      const updatePagoDestino = await destino_pago.update(updateEstado, {
        where: { pago_id: id },
        transaction: t, // Agrega la transacción aquí
      });
    });

    return res
      .status(200)
      .json({ msg: "Validación de pago realizada con éxito!.", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Hubo un error.", status: 500 });
  }
};

const reprogramacionPago = async (req, res, next) => {
  let info = {
    pago_id: req.body.pago_id,
    destino_id: req.body.destino_id,
    tipo: req.body.tipo,
    estado: req.body.estado,
  };

  try {
    await sequelize.transaction(async (t) => {
      if (info.estado === "completado") {
        const getPago = await pago.findAll({
          where: { id: info.pago_id },
          include: [
            {
              model: contrato_pago,
              attributes: { exclude: ["contrato_pago_id"] },
            },
          ],
          transaction: t,
        });

        const filterPago = getPago.filter(
          (item) => item.contrato_pagos.length > 0
        );
        let observacionData = {
          observacion: req?.body?.observacion,
        };
        const updatePago = await pago.update(observacionData, {
          where: { id: info.pago_id },
          transaction: t,
        });

        if (filterPago.length > 0) {
          let ids = getPago
            ?.map((item) =>
              item?.contrato_pagos?.map((data) => data.contrato_id)
            )
            .flat();

          const getTeletrans = await teletrans.findAll({
            where: { contrato_id: ids },
            transaction: t,
          });

          let contra_pago = getPago
            ?.map((item) =>
              item?.contrato_pagos?.map((data) => {
                return {
                  contrato_id: data.contrato_id,
                  teletrans: data.teletrans,
                };
              })
            )
            .flat();

          const joinData = getTeletrans.map((item) => {
            const data = contra_pago.find(
              (ele) => ele.contrato_id === item.contrato_id
            );

            if (data) {
              return {
                contrato_id: item.contrato_id,
                teletrans:
                  parseFloat(item.teletrans) + parseFloat(data.teletrans),
              };
            }
          });

          const updateTeletrans = joinData.map(async (item) => {
            await teletrans.update(item.teletrans, {
              where: { contrato_id: item.contrato_id },
              transaction: t,
            });
          });
        }

        const delDestinoPago = await destino_pago.destroy({
          where: { destino_id: info.destino_id },
          transaction: t,
        });
        const delDestino = await destino.destroy({
          where: { id: info.destino_id },
          transaction: t,
        });

        const newDate = new Date();
        const day = dayjs(newDate).format("YYYY-MM-DD");
        let state = {
          estado: "programado",
          fecha_pago: day,
        };

        const updateState = await pago.update(state, {
          where: { id: info.pago_id },
          transaction: t,
        });
      }
    });

    return res.status(200).json({
      msg: "Se realizo la reprogramación correctamente.",
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Hubo un error.", status: 500 });
  }
};

const BusquedaPagos = async (req, res, next) => {
  const { term, sortBy } = req.query;

  console.log(term);
  let searchTerm = "%" + term.toLowerCase() + "%";
  try {
    if (term) {
      const getAsociacion = await asociacion.findAll({});
      const getPago = await pago.findAll({
        where: { [Op.or]: [{ estado: "pagado" }, { estado: "completado" }] },
        include: [
          { model: destino_pago, include: [{ model: destino }] },
          {
            model: contrato_pago,
            attributes: { exclude: ["contrato_pago_id"] },
            include: [
              {
                model: contrato,

                attributes: ["id", "gerencia_id", "area_id", "puesto_id"],
                include: [{ model: aprobacion_contrato_pago }],
              },
              {
                model: pago_asociacion,
                include: [
                  {
                    model: trabajador,
                    where: { nombre: { [Op.like]: searchTerm } },

                    attributes: [
                      "nombre",
                      "telefono",
                      "dni",
                      "apellido_materno",
                      "apellido_paterno",
                    ],
                  },
                ],
              },
              {
                model: contrato_pago_trabajador,
                include: [
                  {
                    model: trabajador,
                    where: workerWhereCondition,

                    attributes: [
                      "nombre",
                      "apellido_paterno",
                      "apellido_materno",
                      "telefono",
                      "dni",
                    ],

                    include: [
                      {
                        model: trabajador_contrato,
                        include: [
                          {
                            model: contrato,
                            where: contractWhereCondition,

                            attributes: [
                              "id",
                              "gerencia_id",
                              "area_id",
                              "puesto_id",
                            ],
                            include: [
                              { model: aprobacion_contrato_pago },
                              {
                                model: area,
                                where: { nombre: { [Op.like]: searchTerm } },
                              },
                              {
                                model: cargo,
                                where: { nombre: { [Op.like]: searchTerm } },
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
              {
                model: contrato,
                where: contractWhereCondition,

                attributes: ["id", "gerencia_id", "area_id", "puesto_id"],
                include: [
                  { model: aprobacion_contrato_pago },
                  { model: empresa },
                ],
              },
            ],
          },
          {
            model: ayuda_pago,
            include: [
              {
                model: trabajador,
                where: workerWhereCondition,

                attributes: [
                  "nombre",
                  "telefono",
                  "dni",
                  "apellido_materno",
                  "apellido_paterno",
                ],
              },
            ],
          },
        ],
      });

      const formatAsociacion = getPago
        .filter(
          (item) => item?.contrato_pagos?.at(-1)?.pago_asociacions?.length > 0
        )
        .map((item) => {
          return {
            observacion: item?.observacion,
            fecha_pago: item?.fecha_pago,
            tipo: item?.tipo,
            estado: item?.estado,
            volquetes: item?.volquetes,
            teletrans: item?.teletrans,
            destino: item.destino_pagos,
            quincena: item.quincena,
            pago_id: item.contrato_pagos.map((data) => data.pago_id).toString(),
            pagos: item?.contrato_pagos
              ?.map((data) => {
                const aprobacionData =
                  data.contrato.aprobacion_contrato_pagos.find(
                    (ele) => ele.subarray_id == item.quincena
                  );
                const asociacion = getAsociacion.find(
                  (ele) => ele.id == aprobacionData.asociacion_id
                );
                return {
                  contrato_id: data?.contrato_id,
                  pago_id: data?.pago_id,
                  asociacion_id: asociacion?.id,
                  nombre: asociacion?.nombre,
                  tipo_asociacion: asociacion.tipo,
                  area: "---",
                  cargo: "---",
                  celular: "---",
                  dni: "---",
                  trabajadores: data?.pago_asociacions.map((dat) => {
                    return {
                      fecha_quincena:
                        aprobacionData?.fecha_inicio +
                        " - " +
                        aprobacionData?.fecha_fin,
                      contrato_id: data?.contrato_id,
                      volquetes: dat?.volquetes,
                      teletrans: dat?.teletrans,
                      dni: dat?.trabajador?.dni,
                      telefono: dat?.trabajador?.telefono,
                      nombre:
                        dat?.trabajador?.apellido_paterno +
                        " " +
                        dat?.trabajador?.apellido_paterno +
                        " " +
                        dat?.trabajador?.apellido_materno,
                    };
                  }),
                };
              })
              .at(-1),
          };
        })
        .filter((item) => item.tipo === "asociacion");
      const formatPagoNormal = getPago
        .filter(
          (item) =>
            item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
            item.contrato_pagos.length > 0
        )
        .map((item) => {
          return {
            pago_id: item?.id,
            teletrans: item?.teletrans,
            observacion: item?.observacion,
            fecha_pago: item?.fecha_pago,
            estado: item?.estado,
            tipo: item?.tipo,
            destino: item?.destino_pagos,
            volquetes: item.volquetes,
            pagos: {
              trabajadores: item?.contrato_pagos.flatMap((data) => {
                const aprobacionData =
                  data.contrato.aprobacion_contrato_pagos.find(
                    (ele) => ele.subarray_id == data.quincena
                  );

                return data?.contrato_pago_trabajadors?.map((dat) => {
                  return {
                    contrato_id: data?.contrato_id,
                    fecha_quincena:
                      aprobacionData?.fecha_inicio +
                      " - " +
                      aprobacionData?.fecha_fin,
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
                    cargo: dat?.trabajador?.trabajador_contratos
                      ?.map((da) => da?.contrato?.cargo?.nombre)
                      .toString(),
                  };
                });
              }),
            },
          };
        })
        .filter((item) => item.tipo === "pago");

      const formatPagoIncentivo = getPago
        .filter(
          (item) =>
            item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
            item.contrato_pagos.length > 0
        )
        .map((item) => {
          return {
            pago_id: item?.id,
            teletrans: item?.teletrans,
            observacion: item?.observacion,
            fecha_pago: item?.fecha_pago,
            estado: item?.estado,
            tipo: item?.tipo,
            destino: item?.destino_pagos,
            volquetes: item.volquetes,
            pagos: {
              trabajadores: item?.contrato_pagos.flatMap((data) => {
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
                    cargo: dat?.trabajador?.trabajador_contratos
                      ?.map((da) => da?.contrato?.cargo?.nombre)
                      .toString(),
                  };
                });
              }),
            },
          };
        })
        .filter((item) => item.tipo === "incentivo");

      const formatPagoCasa = getPago
        .filter(
          (item) =>
            item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
            item.contrato_pagos.length > 0
        )
        .map((item) => {
          return {
            pago_id: item?.id,
            teletrans: item?.teletrans,
            observacion: item?.observacion,
            fecha_pago: item?.fecha_pago,
            estado: item?.estado,
            tipo: item?.tipo,
            destino: item?.destino_pagos,

            volquetes: item.volquetes,
            pagos: item?.contrato_pagos
              .map((data) => {
                return {
                  trabajadores: [
                    {
                      contrato_id: data?.contrato_id,
                      dni: "-----",
                      volquetes: data?.volquetes,
                      teletrans: data?.teletrans,
                      nombre: data?.contrato?.empresa?.razon_social,
                      ruc: data?.contrato?.empresa?.ruc,
                    },
                  ],
                };
              })
              .at(-1),
          };
        })
        .filter((item) => item.tipo === "casa");

      const concatData = formatAsociacion.concat(formatPagoNormal);
      const concat2 = concatData.concat(formatPagoCasa);
      const concat3 = concat2
        .concat(formatPagoIncentivo)
        .filter((item) => item.estado !== "programado");

      return res.status(200).json({ data: concat3 });
    }
  } catch (error) {
    res.status(500).json(error);
  }
};

const asociacionPago = async (req, res, next) => {
  try {
    let info = {
      hora: req.body.hora,
      placa: req.body.placa,
      propietario: req.body.propietario,
      trapiche: req.body.trapiche,
      volquetes: req.body.volquetes,
      teletrans: req.body.teletrans,
    };

    const saldo = await teletrans.findAll({
      raw: true,
      where: { contrato_id: req.body.contrato_id },
    });

    const totalTeletrans = saldo.map((item) => {
      return {
        id: item.id,
        contrato_id: item.contrato_id,
        saldo: parseFloat(item.saldo),
      };
    });

    // el resultado de restar el saldo de la tabla teletrans - los teletrans a pagar
    // let result = totalTeletrans.map((item) => {
    //   const resta = req.body.trabajadores.find(
    //     (el) => el.contrato_id === item.contrato_id
    //   );
    //   if (resta) {
    //     return {
    //       ...item,
    //       saldo: parseFloat(item.saldo) - parseFloat(resta.teletrans),
    //     };
    //   } else {
    //     return item;
    //   }
    // });

    // const filterContratoTerminado = result.filter((item) => item.saldo === 0);
    // // suma de los ttrans para validar si es un volquete

    const create = await destino.create(info);

    const data = {
      destino_id: create.id,
      pago_id: req.body.pago_id,
      estado: "completado",
    };
    const pagoEstado = {
      estado: "completado",
    };
    const pagoDestino = await destino_pago.create(data);
    const updatePago = await pago.update(pagoEstado, {
      where: {
        id: req.body.pago_id,
      },
    });

    // const updateTeletrans = result.map(
    //   async (item) =>
    //     await teletrans.update(
    //       { saldo: item.saldo },
    //       {
    //         where: { id: item.id },
    //       }
    //     )
    // );

    // if (filterContratoTerminado.length > 0) {
    //   // revisar que cambie el estado del contrato, ademas validar que no se pague mas de lo que se debe
    //   const idsContratos = filterContratoTerminado.map(
    //     (item) => item.contrato_id
    //   );
    //   const updateContrato = await contrato.update(estadoContrato, {
    //     where: { id: idsContratos },
    //   });
    //   // const updateEvaluacion = await evaluacion.update(estadoContrato, {
    //   //   where: { id: req.body[req.body.length - 1]?.evaluacion_id },
    //   // });
    // }

    res.status(200).json({ msg: "Pago realizado con éxito!", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo realizar el pago.", status: 500 });
  }
};
const deletePagoAsociacion = async (req, res, next) => {
  let id = req.params.id;
  try {
    await sequelize.transaction(async (t) => {
      const getDestinoPago = await destino_pago.findAll({
        where: { pago_id: id },
      });

      const getContratoPago = await contrato_pago.findAll({
        where: { pago_id: id },
        attributes: { exclude: ["contrato_pago_id"] },
      });

      const ids = getDestinoPago.map((item) => item.destino_id);
      const idsContratoPago = getContratoPago.map((item) => item.id);

      // let delDestinoPago = await destino_pago.destroy({
      //   where: { pago_id: id },
      // });

      // let delDestino = await destino.destroy({ where: { id: ids } });

      // // Elimina las filas en la tabla contrato_pago_trabajador antes de eliminar las filas de contrato_pago
      // await contrato_pago_trabajador.destroy({
      //   where: { contrato_pago_id: idsContratoPago },
      // });
      console.log(idsContratoPago);
      // Elimina las filas de la tabla pago_asociacion antes de eliminar las filas de contrato_pago
      // await pago_asociacion.destroy({
      //   where: { contrato_pago_id: idsContratoPago },
      // });

      // // Elimina las filas de la tabla ayuda_pago antes de eliminar las filas de contrato_pago
      // await ayuda_pago.destroy({
      //   where: { contrato_pago_id: idsContratoPago },
      // });

      // // Ahora puedes eliminar las filas de la tabla contrato_pago
      // let delContratoPago = await contrato_pago.destroy({
      //   where: { pago_id: id },
      // });

      // let del = await pago.destroy({ where: { id: id } });
    });

    return res
      .status(200)
      .json({ msg: "Pago eliminado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

// terminar de revisar faltan nombres
const filtroPagoFecha = async (req, res, next) => {
  const { inicio, fin } = req.query;

  try {
    const getPago = await pago.findAll({
      where: {
        [Op.or]: [{ estado: "pagado" }, { estado: "completado" }],
        fecha_pago: {
          [Op.between]: [
            dayjs(inicio).format("YYYY-MM-DD"),
            dayjs(fin).format("YYYY-MM-DD"),
          ],
        },
      },
      include: [
        { model: destino_pago, include: [{ model: destino }] },
        {
          model: contrato_pago,
          attributes: { exclude: ["contrato_pago_id"] },

          include: [
            {
              model: pago_asociacion,
              include: [
                {
                  model: trabajador,
                  attributes: { exclude: ["usuarioId"] },
                  include: [{ model: asociacion }],
                },
              ],
            },
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
              include: [
                { model: asociacion },
                {
                  model: trabajador_contrato,
                  include: [
                    {
                      model: trabajador,
                      attributes: { exclude: ["usuarioId"] },
                      include: [
                        {
                          model: trabajadorAsistencia,
                          attributes: {
                            exclude: [
                              "trabajadorId",
                              "asistenciumId",
                              "trabajadorDni",
                            ],
                          },
                          include: [{ model: asistencia }],
                        },
                      ],
                    },
                  ],
                },
                { model: empresa },
                { model: area },
                { model: cargo, attributes: { exclude: ["cargo_id"] } },
              ],
            },
          ],
        },
        {
          model: ayuda_pago,
        },
      ],
    });

    const formatAsociacion = getPago
      .filter(
        (item) => item?.contrato_pagos?.at(-1)?.pago_asociacions?.length > 0
      )
      .map((item) => {
        return {
          hora: "hora",
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          tipo: item?.tipo,
          estado: item?.estado,
          volquetes: item.volquetes,
          teletrans: item.teletrans,
          destino: item?.destino_pagos,
          pagos: item?.contrato_pagos
            ?.map((data) => {
              return {
                contrato_id: data?.contrato_id,
                pago_id: data?.pago_id,
                asociacion_id: data?.contrato?.asociacion?.id,
                nombre: data?.contrato?.asociacion?.nombre,
                tipo_asociacion: data?.contrato?.asociacion?.tipo,
                area: "---",
                cargo: "---",
                celular: "---",
                dni: "---",
                fecha_inicio: dayjs(data?.contrato?.fecha_inicio).format(
                  "YYYY-MM-DD"
                ),
                fecha_fin: dayjs(data?.contrato?.fecha_inicio)
                  .add(14, "day")
                  .format("YYYY-MM-DD"),

                trabajadores: data?.pago_asociacions.map((dat) => {
                  return {
                    contrato_id: data?.contrato_id,
                    teletrans: dat?.teletrans,
                    dni: dat?.trabajador?.dni,
                    telefono: dat?.trabajador?.telefono,
                    nombre:
                      dat?.trabajador?.apellido_paterno +
                      " " +
                      dat?.trabajador?.apellido_materno +
                      " " +
                      dat?.trabajador?.nombre,
                  };
                }),
              };
            })
            .at(-1),
        };
      });

    const formatAyuda = getPago
      .filter(
        (item) =>
          item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
          item?.ayuda_pagos.length > 0
      )
      .map((item) => {
        return {
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          tipo: item?.tipo,
          estado: item?.estado,

          volquetes: item.volquetes,
          teletrans: item.teletrans,
          destino: item?.destino_pagos,
          pagos: item?.contrato_pagos
            ?.map((data) => {
              return {
                contrato_id: "---",
                pago_id: data?.pago_id,
                nombre:
                  data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                    ?.nombre +
                  " " +
                  data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                    ?.apellido_paterno +
                  " " +
                  data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                    ?.apellido_materno,
                area: "---",
                cargo: "---",
                celular: data?.trabajador?.telefono,
                dni: data?.trabajador?.dni,
              };
            })
            .at(-1),
        };
      });

    const formatPagoNormal = getPago
      .filter(
        (item) =>
          item?.contrato_pagos?.at(-1)?.pago_asociacions?.length === 0 &&
          item?.ayuda_pagos.length === 0 &&
          item.contrato_pagos.length > 0
      )
      .map((item) => {
        return {
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          tipo: item?.tipo,
          estado: item?.estado,
          volquetes: item.volquetes,
          teletrans: item.teletrans,
          destino: item?.destino_pagos,
          pagos: item?.contrato_pagos
            ?.map((data, i) => {
              return {
                contrato_id: data?.contrato_id,
                pago_id: data?.pago_id,
                trabajadores: [
                  {
                    volquetes: item.volquetes,
                    teletrans: item.teletrans,
                    nombre: data?.contrato?.empresa?.razon_social
                      ? data?.contrato?.empresa?.razon_social
                      : data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                          ?.nombre +
                        " " +
                        data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                          ?.apellido_paterno +
                        " " +
                        data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                          ?.apellido_materno,
                    area: data?.contrato?.area.nombre,
                    cargo:
                      data?.contrato?.asociacion !== null
                        ? data?.contrato?.asociacion?.tipo
                        : data?.contrato?.cargo?.nombre,
                    celular:
                      data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                        .telefono,
                    dni: data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                      .dni,
                    fecha_inicio: dayjs(data?.contrato?.fecha_inicio).format(
                      "DD-MM-YYYY"
                    ),
                    fecha_fin: dayjs(data?.contrato?.fecha_fin).format(
                      "DD-MM-YYYY"
                    ),
                  },
                ],
              };
            })
            .at(-1),
        };
      });

    const concatData = formatAsociacion.concat(formatAyuda);
    const concat2 = concatData.concat(formatPagoNormal);

    res.status(200).json({ data: concat2 });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ data: error });
  }
};

const getListaPagoIndividual = async (req, res, next) => {
  try {
    const get = await trabajador.findAll({
      where: {
        [Op.and]: [
          { asociacion_id: { [Op.is]: null } },
          { deshabilitado: { [Op.not]: true } },
        ],
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
                [Op.and]: [{ finalizado: { [Op.not]: true } }],
              },
              include: [
                { model: cargo, attributes: { exclude: ["cargo_id"] } },
                {
                  model: contrato_pago,
                  attributes: { exclude: ["contrato_pago_id"] },
                  include: [
                    {
                      model: pago,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const getPago = await pago.findAll({
      include: [
        {
          model: contrato_pago,
          attributes: { exclude: ["contrato_pago_id"] },
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },

              include: [
                { model: cargo, attributes: { exclude: ["cargo_id"] } },
                {
                  model: trabajador_contrato,
                  include: [
                    {
                      model: trabajador,
                      // where: {
                      //   [Op.and]: [
                      //     { asociacion_id: { [Op.is]: null } },
                      //     { deshabilitado: { [Op.not]: true } },
                      //   ],
                      // },
                      attributes: { exclude: ["usuarioId"] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const filterIncentivo = getPago.filter((item) => item?.tipo === "pago");

    // const formatData = filterContratoPago.map((item) => {
    //   return {
    //     nombre:
    //       item?.apellido_paterno +
    //       " " +
    //       item?.apellido_materno +
    //       " " +
    //       item?.nombre,
    //     celular: item?.telefono,
    //     cargo: item?.contratos?.at(-1)?.puesto,
    //     contrato_id: item.contratos?.at(-1).id,
    //     pago: item?.contratos
    //       ?.at(-1)
    //       ?.contrato_pagos?.map((data) => {
    //         return {
    //           id: data?.pago?.id,
    //           teletrans: data?.pago?.teletrans,
    //           observacion: data?.pago?.observacion,
    //           fecha_pago: data?.pago?.fecha_pago,
    //           tipo: data?.pago?.tipo,
    //         };
    //       })
    //       .sort((a, b) => a.id - b.id)
    //       .at(-1),
    //   };
    // });

    const format = filterIncentivo
      .map((item) => {
        return {
          pago_id: item?.id,
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          tipo: item?.tipo,
          estado: item?.estado,
          trabajadores: item?.contrato_pagos?.map((data) => {
            return {
              contrato_id: data?.contrato_id,
              cargo: data?.contrato?.cargo?.nombre,
              teletrans: data?.teletrans,
              nombre:
                data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                  ?.nombre +
                " " +
                data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                  ?.apellido_paterno +
                " " +
                data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                  ?.apellido_materno,
              celular:
                data?.contrato?.trabajador_contratos.at(-1)?.trabajador
                  ?.telefono,
            };
          }),
        };
      })
      ?.filter((item) => item?.estado === "programado");

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

module.exports = {
  postPago,
  postMultiplePagos,
  createProgramacion,
  getPagoFecha,
  deletePago,
  historialProgramacion,
  createProgramacionMultiple,
  updateProgramacion,
  updateProgramacionMultiple,
  validacionPago,
  reprogramacionPago,
  BusquedaPagos,
  asociacionPago,
  deletePagoAsociacion,
  filtroPagoFecha,
  getListaPagoIndividual,
};
