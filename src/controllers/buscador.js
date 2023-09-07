const { Op } = require("sequelize");
const { trabajador, contrato, contrato_pago, pago, destino, asistencia, empresa, asociacion, pago_asociacion, destino_pago, trabajadorAsistencia, ayuda_pago } = require("../../config/db");

// no esta en uso pero era un buscador desde el servidor


const BusquedaPagos = async (req, res, next) => {
  const { term, sortBy } = req.query;

  try {
    if (term) {
      const getPago = await pago.findAll({
        // where: { estado: "completado" },
        include: [
          { model: destino_pago, include: [{ model: destino }] },
          {
            model: contrato_pago,
            attributes: { exclude: ["contrato_pago_id"] },
  
            include: [
              { model: pago_asociacion },
              {
                model: contrato,
                attributes: { exclude: ["contrato_id"] },
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
                  { model: empresa },
                  { model: asociacion },
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
            hora: item?.hora,
            observacion: item?.observacion,
            fecha_pago: item?.fecha_pago,
            tipo: item?.tipo,
            estado: item?.estado,
            volquete:
              parseFloat(item?.teletrans) % 4 === 0
                ? parseFloat(item?.teletrans) / 4
                : 0,
            teletrans:
              parseFloat(item?.teletrans) % 4 === 0
                ? 0
                : parseFloat(item?.teletrans),
            destino: item?.destino_pagos,
            asociacion: item?.contrato_pagos?.map((data) => {
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
  
                trabajadores: data?.pago_asociacions,
              };
            }),
          };
        })
        .filter((item) => item.estado !== "programado");
  
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
  
            volquete:
              parseFloat(item?.teletrans) % 4 === 0
                ? parseFloat(item?.teletrans) / 4
                : 0,
            teletrans:
              parseFloat(item?.teletrans) % 4 === 0
                ? 0
                : parseFloat(item?.teletrans),
            destino: item?.destino_pagos,
            trabajadores: item?.contrato_pagos?.map((data) => {
              return {
                contrato_id: "---",
                pago_id: data?.pago_id,
                nombre:
                  data?.trabajador?.nombre +
                  " " +
                  data?.trabajador?.apellido_paterno +
                  " " +
                  data?.trabajador?.apellido_materno,
                area: "---",
                cargo: "---",
                celular: data?.trabajador?.telefono,
                dni: data?.trabajador?.dni,
              };
            }),
          };
        })
        .filter((item) => item.estado !== "programado");
  
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
            volquete:
              parseFloat(item?.teletrans) % 4 === 0
                ? parseFloat(item?.teletrans) / 4
                : 0,
            teletrans:
              parseFloat(item?.teletrans) % 4 === 0
                ? 0
                : parseFloat(item?.teletrans),
            destino: item?.destino_pagos,
            trabajadores: item?.contrato_pagos?.map((data, i) => {
              return {
                contrato_id: data?.contrato_id,
                pago_id: data?.pago_id,
                nombre:
                  data?.contrato?.trabajador !== null
                    ? data?.contrato?.trabajador?.nombre +
                      " " +
                      data?.contrato?.trabajador?.apellido_paterno +
                      " " +
                      data?.contrato?.trabajador?.apellido_materno
                    : data?.contrato?.empresa?.razon_social,
                area: data?.contrato?.area,
                cargo: data?.contrato?.puesto,
                celular: data?.contrato?.trabajador?.telefono,
                dni: data?.contrato?.trabajador?.dni,
                fecha_inicio:
                  data?.contrato?.trabajador?.trabajador_asistencia?.at(
                    (i + 1 - 1) * 15
                  )?.asistencium?.fecha,
                fecha_fin: data?.contrato?.trabajador?.trabajador_asistencia?.at(
                  (i + 1 - 1) * 15 + 14
                )?.asistencium?.fecha,
              };
            }),
          };
        })
        .filter((item) => item.estado !== "programado");
  
      const concatData = formatAsociacion.concat(formatAyuda);
      const concat2 = concatData.concat(formatPagoNormal);

      const busqueda = concat2.filter(item => item?.nombre?.toLowerCase()?.contains(term))
      console.log(busqueda
        );
      return res.status(200).json({
        data: busqueda,
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const filtroTipoPago = async (req, res, next) => {
  const { tipo, sortBy } = req.query;

  try {
    if (term) {
      const product = await pago.findAll({
        where: {
          tipo: {
            [Op.like]: "%" + term + "%",
          },
        },

        // order: orderElements(sortBy),
      });
      return res.status(200).json({
        data: product,
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

module.exports = {
  BusquedaPagos,
};
