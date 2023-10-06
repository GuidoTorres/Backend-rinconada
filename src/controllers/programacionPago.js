const { Op } = require("sequelize");
const {
  aprobacion_contrato_pago,
  contrato,
  cargo,
  teletrans,
  trabajador_contrato,
  trabajador,
  pago,
  saldo,
  detalle_pago,
} = require("../../config/db");

const getAprobacion = async (req, res, next) => {
  try {
    const all = await aprobacion_contrato_pago.findAll({
      where: { asociacion_id: { [Op.is]: null }, pagado: { [Op.not]: true } },
      include: [
        {
          model: contrato,
          attributes: { exclude: ["contrato_id"] },
          include: [
            { model: cargo, attributes: { exclude: ["cargo_id"] } },
            { model: teletrans },
            {
              model: trabajador_contrato,
              include: [
                { model: trabajador, attributes: { exclude: ["usuarioId"] } },
                { model: detalle_pago, include: [{ model: pago }] },
              ],
            },
          ],
        },
      ],
    });

    // const filterAprobacion = all.filter(item => item.estado=== true)

    const format = all
      .map((item, i) => {
        // Calcula el total de pagos
        const pagosTotal =
          item?.contrato?.trabajador_contratos[0]?.detalle_pagos
            ?.filter((pago) => pago?.pago?.quincena == item.subarray_id)
            ?.reduce(
              (acc, pago) =>
                acc +
                (parseFloat(pago.volquetes) || 0) * 4 +
                (parseFloat(pago.teletrans) || 0),
              0
            );
        // Calcula el saldo final
        const saldoFinal = item.contrato.teletrans.at(-1).saldo - pagosTotal;
        if (saldoFinal <= 0) {
          updateEstadoAprobacionContratoPago(item.id);
        }
        if (saldoFinal > 0) {
          return {
            quincena: item.subarray_id,

            observaciones: item.observaciones,
            nombre: item?.nombre,
            cargo: item?.contrato?.cargo?.nombre,
            volquetes: item?.contrato?.teletrans?.at(-1)?.volquete,
            teletrans: item?.contrato?.teletrans?.at(-1)?.teletrans,
            saldo: item.contrato.teletrans.at(-1).saldo,
            fecha_inicio: item?.fecha_inicio,
            fecha_fin: item?.fecha_fin,
            contrato_id: item?.contrato_id,
            dni: item?.dni,
            estado: item.estado,
            trabajador_contrato_id: item?.contrato?.trabajador_contratos[0]?.id,
            telefono: item.contrato.trabajador_contratos
              ?.map((data) => data.trabajador.telefono)
              .toString(),
            saldoFinal: saldoFinal,
          };
        }
      })
      .filter((item) => item !== undefined)
      .map((item, i) => {
        return { id: i + 1, ...item };
      });

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

async function updateEstadoAprobacionContratoPago(id) {
  try {
    await aprobacion_contrato_pago.update(
      { pagado: true },
      { where: { id: id } }
    );
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getAprobacion };
