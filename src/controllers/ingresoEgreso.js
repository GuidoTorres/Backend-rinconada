const {
  ingresos_egresos,
  saldo,
  trabajador,
  sucursal,
  detalle_ingreso_egreso,
} = require("../../config/db");
const { Op } = require("sequelize");
const XLSX = require("xlsx");

// ingresos y egreos del modulo de finanzas

// lista de ingresos y egreosos
const getIngresoEgresos = async (req, res, next) => {
  try {
    const get = await ingresos_egresos.findAll({
      include: [{ model: detalle_ingreso_egreso }],
    });
    return res.status(200).json({ data: get });
  } catch (error) {
    res.status(500).json();
  }
};
// lista de ingresos y egreosos por id
const getIngresoEgresosById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const getById = await ingresos_egresos.findAll({
      where: { sucursal_id: id },
      include: [{ model: detalle_ingreso_egreso }],
    });
    return res.status(200).json({ data: getById });
  } catch (error) {
    res.status(500).json(error);
  }
};
// crear ingreso o egreso
const postIngresoEgreso = async (req, res, next) => {
  try {
    const {
      sucursal_id,
      fecha,
      forma_pago,
      encargado,
      area,
      cantidad,
      medida,
      descripcion,
      monto,
      proveedor,
      comprobante,
      movimiento,
      sucursal_transferencia,
      dni,
      nro_comprobante,
      productos,
    } = req.body;
    const getSaldo = await saldo.findAll({
      where: { sucursal_id: req.body.sucursal_id },
    });

    let movimientoObj = {
      sucursal_id,
      fecha,
      movimiento,
      forma_pago,
      dni,
      encargado,
      area,
      descripcion,
      monto: parseFloat(monto),
      proveedor,
      comprobante,
      sucursal_transferencia,
      nro_comprobante,
    };

    let totalMovimiento;
    if (productos.length > 0) {
      totalMovimiento = productos.reduce((acumulado, producto) => {
        return acumulado + producto.precio * producto.cantidad;
      }, 0);
      movimientoObj.monto = parseFloat(totalMovimiento);
    }

    // para registrar ingresos y egresos
    if (!sucursal_transferencia && sucursal_id) {
      let newSaldo;
      if (movimiento === "Ingreso") {
        movimientoObj = {
          ...movimientoObj,
          ingresos:
            getSaldo?.at(-1)?.ingresos + parseFloat(movimientoObj.monto),
          saldo_final:
            getSaldo?.at(-1)?.saldo_final + parseFloat(movimientoObj.monto),
        };
        newSaldo = {
          ingresos:
            getSaldo?.at(-1)?.ingresos + parseFloat(movimientoObj.monto),
          saldo_final:
            getSaldo?.at(-1)?.saldo_final + parseFloat(movimientoObj.monto),
        };
      } else {
        movimientoObj = {
          ...movimientoObj,
          egresos: getSaldo?.at(-1)?.egresos + parseFloat(movimientoObj.monto),
          saldo_final:
            getSaldo?.at(-1)?.saldo_final - parseFloat(movimientoObj.monto),
        };
        newSaldo = {
          egresos: getSaldo?.at(-1)?.egresos + parseFloat(movimientoObj.monto),
          saldo_final:
            getSaldo?.at(-1)?.saldo_final - parseFloat(movimientoObj.monto),
        };
        const ingresoEgreso = await ingresos_egresos.create(movimientoObj);
        if (productos.length > 0) {
          const producto = req.body.productos.map((item) => {
            return {
              ingreso_egreso_id: ingresoEgreso.id,
              producto: item.producto,
              precio: item.precio,
              cantidad: item.cantidad,
              medida: item.medida,
              categoria: item.categoria,
            };
          });
          await detalle_ingreso_egreso.bulkCreate(producto);
        }
      }

      await saldo.update(newSaldo, {
        where: { sucursal_id: req.body.sucursal_id },
      });
      return res
        .status(200)
        .json({ msg: "Movimiento registrado con éxito!", status: 200 });
    }

    // para registrar las transferencias y actualizar el saldo de cada sucursal
    if (
      movimiento === "Egreso" &&
      sucursal_transferencia &&
      sucursal_transferencia !== sucursal_id
    ) {
      const getSaldoEgreso = await saldo.findAll({
        where: { sucursal_id: req.body.sucursal_transferencia },
      });
      let objEgresoTransferencia = {
        ...movimientoObj,
        egresos: getSaldo?.at(-1)?.egresos + parseFloat(movimientoObj.monto),
        saldo_final:
          getSaldo?.at(-1)?.saldo_final - -parseFloat(movimientoObj.monto),
      };
      let objIngresoTransferencia = {
        ...movimientoObj,
        movimiento: "Ingreso",
        ingresos:
          getSaldoEgreso?.at(-1)?.ingresos + parseInt(movimientoObj.monto),
        saldo_final:
          getSaldoEgreso?.at(-1)?.saldo_final + parseFloat(movimientoObj.monto),
      };
      let newSaldoEgresoTransferencia = {
        egresos: getSaldo?.at(-1)?.egresos + parseFloat(movimientoObj.monto),
        saldo_final:
          getSaldo?.at(-1)?.saldo_final - parseFloat(movimientoObj.monto),
      };
      let newSaldoIngresoTransferencia = {
        ingresos:
          getSaldoEgreso?.at(-1)?.ingresos + parseFloat(movimientoObj.monto),
        saldo_final:
          getSaldoEgreso?.at(-1)?.saldo_final + parseFloat(movimientoObj.monto),
      };
      await ingresos_egresos.create(objEgresoTransferencia);
      await ingresos_egresos.create(objIngresoTransferencia);

      await saldo.update(newSaldoEgresoTransferencia, {
        where: { sucursal_id: req.body.sucursal_id },
      });
      await saldo.update(newSaldoIngresoTransferencia, {
        where: { sucursal_id: req.body.sucursal_transferencia },
      });

      return res
        .status(200)
        .json({ msg: "Movimiento registrado con éxito!", status: 200 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};
// actualizar ingreso egreso
const updateIngresoEgreso = async (req, res, next) => {
  let id = req.params.id;
  try {
    let getIngresos = await ingresos_egresos.findAll({
      where: { id: req.body.id },
    });
    const getSaldoDestino = await saldo.findAll({
      where: { sucursal_id: getIngresos?.at(-1)?.sucursal_transferencia },
    });
    let getSaldoOrigen = await saldo.findAll({
      where: { sucursal_id: id },
    });
    let totalMovimiento;
    if (req.body.productos.length > 0) {
      totalMovimiento = req.body.productos.reduce((acumulado, producto) => {
        return acumulado + producto.precio * producto.cantidad;
      }, 0);
      req.body.monto = parseFloat(totalMovimiento);
    }
    const saldoOrigen = getSaldoOrigen?.at(-1);
    const ingreso = getIngresos?.at(-1);

    let saldoFinal = parseFloat(saldoOrigen?.saldo_final);
    let ingresoActual = parseFloat(saldoOrigen?.ingresos);
    let montoAnterior = parseFloat(ingreso?.monto);
    let montoNuevo = parseFloat(req.body.monto);
    let egresoActual = parseFloat(saldoOrigen?.egresos);
    if (req.body.movimiento === "Ingreso") {
      let newSaldoIngreso = {
        ingresos: ingresoActual - montoAnterior + montoNuevo,
        saldo_final: saldoFinal - montoAnterior + montoNuevo,
      };
      await ingresos_egresos.update(req.body, {
        where: { id: req.body.id },
      });
      await saldo.update(newSaldoIngreso, {
        where: { sucursal_id: req.body.sucursal_id },
      });
      return res
        .status(200)
        .json({ msg: "Movimiento actualizado con éxito!", status: 200 });
    }
    if (req.body.movimiento === "Egreso" && !req.body.sucursal_transferencia) {
      let newSaldoEgreso = {
        egresos: egresoActual - montoAnterior + montoNuevo,
        saldo_final: saldoFinal + montoAnterior - montoNuevo,
      };

      await ingresos_egresos.update(req.body, {
        where: { id: req.body.id },
      });
      if (req.body.productos.length > 0) {
        const producto = req.body.productos.map((item) => {
          return {
            ingreso_egreso_id: req.body.id,
            producto: item.producto,
            precio: item.precio,
            cantidad: item.cantidad,
            medida: item.medida,
            categoria: item.categoria,
          };
        });
        await detalle_ingreso_egreso.destroy({
          where: { ingreso_egreso_id: req.body.id },
        });
        await detalle_ingreso_egreso.bulkCreate(producto);
      }
      await saldo.update(newSaldoEgreso, {
        where: { sucursal_id: req.body.sucursal_id },
      });
      return res
        .status(200)
        .json({ msg: "Movimiento actualizado con éxito!", status: 200 });
    }
    if (req.body.movimiento === "Egreso" && req.body.sucursal_transferencia) {
      let saldoFinalOrigen = getSaldoOrigen?.at(-1)?.saldo_final;
      let egresoActualOrigen = getSaldoOrigen?.at(-1)?.egresos;
      let montoAnterior = getIngresos?.at(-1)?.monto;
      let montoNuevo = parseFloat(req.body.monto);
      let saldoFinalDestino = getSaldoDestino?.at(-1)?.saldo_final;
      let ingresoActualDestino = getSaldoDestino?.at(-1)?.ingresos;
      let newSaldoOrigen = {
        egresos:
          parseFloat(egresoActualOrigen) -
          parseFloat(montoAnterior) +
          montoNuevo,
        saldo_final:
          parseFloat(saldoFinalOrigen) + parseFloat(montoAnterior) - montoNuevo,
      };

      let newSaldoDestino = {
        ingresos: ingresoActualDestino - montoAnterior + montoNuevo,
        saldo_final: saldoFinalDestino - montoAnterior + montoNuevo,
      };

      const objOrigen = {
        fecha: req?.body?.fecha,
        movimiento: req?.body?.movimiento,
        forma_pago: req?.body?.forma_pago,
        encargado: req?.body?.encargado,
        area: req?.body?.area,
        cantidad: req?.body?.cantidad,
        medida: req?.body?.medida,
        descripcion: req?.body?.descripcion,
        monto: req?.body?.monto,
        proveedor: req?.body?.proveedor,
        comprobante: req?.body?.comprobante,
        sucursal_id: req?.body?.sucursal_id,
        saldo_inicial: req?.body?.saldo_inicial,
        ingresos: req?.body?.ingresos,
        egresos: req?.body?.egresos,
        saldo_final: req?.body?.saldo_final,
        dni: req?.body?.dni,
        sucursal_transferencia: req?.body?.sucursal_transferencia,
        nro_comprobante: req?.body?.nro_comprobante,
        precio: req?.body?.precio,
        categoria: req?.body?.categoria,
      };
      const objDestino = {
        fecha: req?.body?.fecha,
        movimiento: req?.body?.movimiento,
        forma_pago: req?.body?.forma_pago,
        encargado: req?.body?.encargado,
        area: req?.body?.area,
        cantidad: req?.body?.cantidad,
        medida: req?.body?.medida,
        descripcion: req?.body?.descripcion,
        monto: req?.body?.monto,
        proveedor: req?.body?.proveedor,
        comprobante: req?.body?.comprobante,
        sucursal_id: req?.body?.sucursal_transferencia,
        saldo_inicial: req?.body?.saldo_inicial,
        ingresos: req?.body?.ingresos,
        egresos: req?.body?.egresos,
        saldo_final: req?.body?.saldo_final,
        dni: req?.body?.dni,
        sucursal_transferencia: req?.body?.sucursal_transferencia,
        nro_comprobante: req?.body?.nro_comprobante,
        precio: req?.body?.precio,
        categoria: req?.body?.categoria,
      };

      let updateTransferencia = await ingresos_egresos.update(objOrigen, {
        where: {
          [Op.and]: [
            { monto: getIngresos?.at(-1)?.monto },
            { area: getIngresos?.at(-1)?.area },
            { sucursal_id: getIngresos?.at(-1)?.sucursal_id },
            {
              sucursal_transferencia:
                getIngresos?.at(-1)?.sucursal_transferencia,
            },
          ],
        },
      });
      let updateTransferencia2 = await ingresos_egresos.update(objDestino, {
        where: {
          [Op.and]: [
            { monto: getIngresos?.at(-1)?.monto },
            { area: getIngresos?.at(-1)?.area },
            { sucursal_id: getIngresos?.at(-1)?.sucursal_transferencia },
            {
              sucursal_transferencia:
                getIngresos?.at(-1)?.sucursal_transferencia,
            },
          ],
          [Op.not]: [{ id: id }],
        },
      });

      const updateSaldo = await saldo.update(newSaldoOrigen, {
        where: { sucursal_id: req.body.sucursal_id },
      });
      const updateSaldo1 = await saldo.update(newSaldoDestino, {
        where: { sucursal_id: getIngresos?.at(-1)?.sucursal_transferencia },
      });
      return res
        .status(200)
        .json({ msg: "Movimiento actualizado con éxito!", status: 200 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteIngresoEgreso = async (req, res, next) => {
  let id = req.params.id;
  try {
    await detalle_ingreso_egreso.destroy({ where: { ingreso_egreso_id: id } });
    let getIngresos = await ingresos_egresos.findAll({
      where: { id: id },
    });

    let getSaldo = await saldo.findAll({
      where: { sucursal_id: getIngresos?.at(-1)?.sucursal_id },
    });

    let getTransferencia = await saldo.findAll({
      where: { sucursal_id: getIngresos?.at(-1)?.sucursal_transferencia },
    });
    let movimiento = getIngresos?.at(-1)?.movimiento;
    if (movimiento === "Ingreso") {
      newSaldoIngreso = {
        ingresos:
          parseInt(getSaldo?.at(-1)?.ingresos) -
          parseInt(getIngresos?.at(-1)?.monto),
        saldo_final:
          parseInt(getSaldo?.at(-1)?.saldo_final) -
          parseInt(getIngresos?.at(-1)?.monto),
      };
      let destroy = await ingresos_egresos.destroy({ where: { id: id } });
      const updateSaldo = await saldo.update(newSaldoIngreso, {
        where: {
          sucursal_id: getIngresos?.at(-1)?.sucursal_id,
        },
      });
      return res.status(200).json({
        msg: "Movimiento eliminado con éxito!",
        status: 200,
      });
    }
    if (
      movimiento === "Egreso" &&
      !getIngresos?.at(-1)?.sucursal_transferencia
    ) {
      console.log("digimon");
      newSaldoEgreso = {
        egresos:
          parseInt(getSaldo?.at(-1)?.egresos) -
          parseInt(getIngresos?.at(-1)?.monto),
        saldo_final:
          parseInt(getSaldo?.at(-1)?.saldo_final) +
          parseInt(getIngresos?.at(-1)?.monto),
      };
      let destroy = await ingresos_egresos.destroy({ where: { id: id } });
      const updateSaldo = await saldo.update(newSaldoEgreso, {
        where: {
          sucursal_id: getIngresos?.at(-1)?.sucursal_id,
        },
      });
      return res.status(200).json({
        msg: "Movimiento eliminado con éxito!",
        status: 200,
      });
    }
    if (
      movimiento === "Egreso" &&
      getIngresos?.at(-1)?.sucursal_transferencia
    ) {
      newSaldoEgreso = {
        egresos:
          parseInt(getSaldo?.at(-1)?.egresos) -
          parseInt(getIngresos?.at(-1)?.monto),

        saldo_final:
          parseInt(getSaldo?.at(-1)?.saldo_final) +
          parseInt(getIngresos?.at(-1)?.monto),
      };

      newSaldoTransferencia = {
        ingresos:
          parseInt(getTransferencia?.at(-1)?.ingresos) -
          parseInt(getIngresos?.at(-1)?.monto),

        saldo_final:
          parseInt(getTransferencia?.at(-1)?.saldo_final) -
          parseInt(getIngresos?.at(-1)?.monto),
      };

      let destroyTransferencia = await ingresos_egresos.destroy({
        where: {
          [Op.and]: [
            { monto: getIngresos?.at(-1)?.monto },
            { area: getIngresos?.at(-1)?.area },
            {
              sucursal_transferencia:
                getIngresos?.at(-1)?.sucursal_transferencia,
            },
          ],
        },
      });
      const updateSaldo = await saldo.update(newSaldoEgreso, {
        where: {
          sucursal_id: getIngresos?.at(-1)?.sucursal_id,
        },
      });
      const updateTransferencia = await saldo.update(newSaldoTransferencia, {
        where: {
          sucursal_id: getIngresos?.at(-1)?.sucursal_transferencia,
        },
      });
      return res.status(200).json({
        msg: "Movimiento eliminado con éxito!",
        status: 200,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};
// reporte de los ingresos para usar en un chart
const reporteIngreso = async (req, res, next) => {
  let id = req.params.id;

  try {
    let filter;
    if (!req.body.area || req.body.area === "-1") {
      filter = {
        sucursal_id: id,
        fecha: { [Op.between]: [req.body.fecha_inicio, req.body.fecha_fin] },
      };
    } else {
      filter = {
        sucursal_id: id,
        area: req.body.area,
        fecha: { [Op.between]: [req.body.fecha_inicio, req.body.fecha_fin] },
      };
    }

    const getIngresoEgresos = await ingresos_egresos.findAll({
      where: filter,
    });

    const newObj = getIngresoEgresos.reduce(function (acc, currentValue) {
      if (!acc[currentValue["fecha"]]) {
        acc[currentValue["fecha"]] = [];
      }
      acc[currentValue["fecha"]].push(currentValue);
      return acc;
    }, {});
    const final2 = [newObj].map((item) => Object.values(item)).flat();

    const final3 = final2
      .map((item) =>
        item
          .map((data) => data)
          .reduce((acc, value) => {
            const item = acc.find((it) => it.movimiento === value.movimiento);
            item
              ? (item.monto = parseFloat(item.monto) + parseFloat(value.monto))
              : acc.push(value);
            return acc;
          }, [])
      )
      .flat()
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const getLabels = [...new Set(final3.map((item) => item.fecha))];

    let labels = getLabels;
    // terminar falta agregar 0 a los ingresos y egresos cuando no hay nada en el dia

    let ingresos = {
      label: "Ingresos",
      type: "line",
      data: getLabels.map((item, i) => {
        let result = final3.find(
          (data, index) => data.movimiento === "Ingreso" && data.fecha === item
        );
        if (result) {
          return parseInt(
            final3
              .filter((data, index) => data.movimiento === "Ingreso")
              .filter((dat) => dat.fecha === item)
              .map((da) => da.monto)
          );
        } else {
          return 0;
        }
      }),
      fill: false,
      borderColor: "rgb(75, 110, 185)",
      tension: 0.1,
    };

    let egresos = {
      label: "Egresos",
      type: "line",
      data: getLabels.map((item, i) => {
        let result = final3.find(
          (data, index) => data.movimiento === "Egreso" && data.fecha === item
        );
        if (result) {
          return parseInt(
            final3
              .filter((data, index) => data.movimiento === "Egreso")
              .filter((dat) => dat.fecha === item)
              .map((da) => da.monto)
          );
        } else {
          return 0;
        }
      }),
      fill: false,
      borderColor: "rgb(222, 101, 92)",
      tension: 0.1,
    };

    const concat = { labels: labels, ingresos: ingresos, egresos: egresos };
    return res.status(200).json({ data: concat });
  } catch (error) {
    res.status(500).json(error);
  }
};
// descargar excel de ingresos y egresos
const convertJsonToExcel = async (req, res, next) => {
  let id = req.params.id;
  let queryConditions = {
    sucursal_id: id,
    fecha: {
      [Op.lte]: req.query.fecha_fin,
    },
  };

  if (req.query.movimiento) {
    queryConditions.movimiento = req.query.movimiento;
  }
  try {
    let saldoInicial = await saldo.findOne({
      where: { sucursal_id: id },
    });

    if (!saldoInicial) {
      throw new Error("No se encontro la sucursal.");
    }

    saldoInicial = parseFloat(saldoInicial.saldo_inicial);

    const transacciones = await ingresos_egresos.findAll({
      where: queryConditions,
      include: [{ model: sucursal }],
      order: [["fecha", "ASC"]],
    });

    // Calcular el saldo hasta la fecha inicial
    transacciones.forEach((transaccion) => {
      if (transaccion.fecha < req.query.fecha_inicio) {
        if (transaccion.ingresos) {
          saldoInicial += Number(parseFloat(transaccion.monto).toFixed(2));
        } else if (transaccion.egresos) {
          saldoInicial -= Number(parseFloat(transaccion.monto).toFixed(2));
        }
      }
    });

    const allMovimientos = transacciones
      .filter((transaccion) => transaccion.fecha >= req.query.fecha_inicio)
      .map((transaccion) => {
        if (transaccion.ingresos) {
          saldoInicial += Number(parseFloat(transaccion.monto).toFixed(2));
        } else if (transaccion.egresos) {
          saldoInicial -= Number(parseFloat(transaccion.monto).toFixed(2));
        }

        return [
          transaccion.fecha,
          transaccion.comprobante,
          transaccion.nro_comprobante,
          transaccion.proveedor,
          transaccion.descripcion,
          transaccion.medida,
          transaccion.cantidad,
          transaccion.precio,
          transaccion.sucursal.nombre,
          transaccion.area,
          transaccion.categoria,
          transaccion.movimiento,
          "Tesorería",
          transaccion.ingresos
            ? Number(parseFloat(transaccion.monto).toFixed(2))
            : "",
          transaccion.egresos
            ? Number(parseFloat(transaccion.monto).toFixed(2))
            : "",
          saldoInicial.toFixed(2), // saldo final actualizado
        ];
      });

    const workSheetColumnsName = [
      "FECHA",
      "COMPROBANTE",
      "NÚMERO",
      "PROVEEDOR",
      "CONCEPTO",
      "MEDIDA",
      "CANTIDAD",
      "PRECIO POR UNIDAD",
      "CAJA",
      "ÁREA",
      "CATEGORIA",
      "TIPO DE GASTO",
      "RESP. DE GASTO",
      "INGRESO",
      "EGRESO",
      "SALDO",
    ];

    const workBook = XLSX.utils.book_new();
    const columnWidths = [
      { wch: 10 }, // "FECHA"
      { wch: 20 }, // "COMPROBANTE"
      { wch: 15 },
      { wch: 40 },
      { wch: 80 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
      { wch: 40 },
      { wch: 60 },
      { wch: 40 },
      { wch: 20 },
      { wch: 40 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    //Consejo administracion
    const workSheetData1 = [workSheetColumnsName, ...allMovimientos];
    const workSheet1 = XLSX.utils.aoa_to_sheet(workSheetData1);
    workSheet1["!cols"] = columnWidths;
    XLSX.utils.book_append_sheet(
      workBook,
      workSheet1,
      "Reporte de movimientos"
    );

    // Usar writeBuffer en lugar de writeFile
    const buffer = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

    // Enviar el buffer al cliente con los encabezados adecuados
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=reporte.xlsx");
    return res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
const convertJsonToExcelComedor = async (req, res, next) => {
  let id = req.params.id;
  let queryConditions = {
    sucursal_id: id,
    fecha: {
      [Op.lte]: req.query.fecha_fin,
    },
  };

  if (req.query.movimiento) {
    queryConditions.movimiento = req.query.movimiento;
  }
  try {
    let saldoInicial = await saldo.findOne({
      where: { sucursal_id: id },
    });

    if (!saldoInicial) {
      throw new Error("No se encontro la sucursal.");
    }

    saldoInicial = parseFloat(saldoInicial.saldo_inicial);

    const transacciones = await ingresos_egresos.findAll({
      where: queryConditions,
      include: [{ model: sucursal }, { model: detalle_ingreso_egreso }],
      order: [["fecha", "ASC"]],
    });

    // Calcular el saldo hasta la fecha inicial
    transacciones.forEach((transaccion) => {
      if (transaccion.fecha < req.query.fecha_inicio) {
        if (transaccion.ingresos) {
          saldoInicial += Number(parseFloat(transaccion.monto).toFixed(2));
        } else if (transaccion.egresos) {
          saldoInicial -= Number(parseFloat(transaccion.monto).toFixed(2));
        }
      }
    });

    const allMovimientos = transacciones
      .filter((transaccion) => transaccion.fecha >= req.query.fecha_inicio)
      .map((transaccion, i) => {
        if (transaccion.ingresos) {
          saldoInicial += Number(parseFloat(transaccion.monto).toFixed(2));
        } else if (transaccion.egresos) {
          saldoInicial -= Number(parseFloat(transaccion.monto).toFixed(2));
        }

        return [
          i+1,
          transaccion.fecha,
          transaccion.comprobante,
          transaccion.nro_comprobante,
          transaccion.proveedor,
          transaccion.descripcion,
          transaccion.medida,
          transaccion.cantidad,
          transaccion.precio,
          transaccion.sucursal.nombre,
          transaccion.area,
          transaccion.categoria,
          transaccion.movimiento,
          "Tesorería",
          transaccion.ingresos
            ? Number(parseFloat(transaccion.monto).toFixed(2))
            : "",
          transaccion.egresos
            ? Number(parseFloat(transaccion.monto).toFixed(2))
            : "",
          saldoInicial.toFixed(2), // saldo final actualizado
        ];
      });

    const workSheetColumnsName = [
      "ITEM",
      "FECHA",
      "COMPROBANTE",
      "NÚMERO",
      "PROVEEDOR",
      "CONCEPTO",
      "UNIDAD MEDIDA",
      "CANTIDAD",
      "PRECIO UNIT.",
      "CAJA",
      "ÁREA",
      "CATEGORIA",
      "TIPO DE GASTO",
      "RESP. DE GASTO",
      "INGRESO",
      "EGRESO",
      "SALDO",
    ];

    const workBook = XLSX.utils.book_new();
    const columnWidths = [
      { wch: 10 }, // "FECHA"
      { wch: 20 }, // "COMPROBANTE"
      { wch: 15 },
      { wch: 40 },
      { wch: 80 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
      { wch: 40 },
      { wch: 60 },
      { wch: 40 },
      { wch: 20 },
      { wch: 40 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    //Consejo administracion
    const workSheetData1 = [workSheetColumnsName, ...allMovimientos];
    const workSheet1 = XLSX.utils.aoa_to_sheet(workSheetData1);
    workSheet1["!cols"] = columnWidths;
    XLSX.utils.book_append_sheet(
      workBook,
      workSheet1,
      "Reporte de movimientos"
    );

    // Usar writeBuffer en lugar de writeFile
    const buffer = XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

    // Enviar el buffer al cliente con los encabezados adecuados
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=reporte.xlsx");
    return res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
//
const getTrabajadorFinanza = async (req, res, next) => {
  try {
    const get = await trabajador.findAll({
      attributes: { exclude: ["usuarioId"] },
    });
    return res.status(200).json({ data: get });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
// para el cuadro del saldo por meses
const getSaldoMensual = async (req, res, next) => {
  let id = req.params.id;

  try {
    const getById = await ingresos_egresos.findAll({
      where: { sucursal_id: id },
      attributes: [
        "movimiento",
        "area",
        "ingresos",
        "egresos",
        "monto",
        "fecha",
      ],
    });

    let movimientosPorMesYAnio = {};

    getById.forEach((item) => {
      let fecha = new Date(item.fecha);
      let mes = fecha.getMonth() + 1;
      let anio = fecha.getFullYear();

      // Ignorar registros con fechas nulas o montos no numéricos
      if (isNaN(fecha.getTime()) || isNaN(item.monto)) {
        return;
      }

      const clave = `${anio}-${mes}`;

      if (!movimientosPorMesYAnio[clave]) {
        movimientosPorMesYAnio[clave] = {
          ingresos: 0,
          egresos: 0,
          mes: getMonthName(mes),
          anio: anio,
        };
      }

      let monto = parseFloat(item.monto);
      if (item.movimiento === "Ingreso" && !isNaN(monto)) {
        movimientosPorMesYAnio[clave].ingresos += monto;
      } else if (item.movimiento === "Egreso" && !isNaN(monto)) {
        movimientosPorMesYAnio[clave].egresos += monto;
      }
    });

    const resultado = Object.values(movimientosPorMesYAnio)
      .map((item) => {
        return {
          ...item,
          total: item.ingresos - item.egresos,
        };
      })
      .filter((item) => item.total !== 0);

    return res.status(200).json({ data: resultado });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
const getMonthName = (monthIndex) => {
  const monthNames = [
    "ene",
    "feb",
    "mar",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return monthNames[monthIndex];
};

module.exports = {
  getIngresoEgresos,
  getIngresoEgresosById,
  postIngresoEgreso,
  updateIngresoEgreso,
  deleteIngresoEgreso,
  reporteIngreso,
  convertJsonToExcel,
  convertJsonToExcelComedor,
  getTrabajadorFinanza,
  getSaldoMensual,
};
