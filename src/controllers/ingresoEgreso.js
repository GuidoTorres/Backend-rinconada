const {
  ingresos_egresos,
  saldo,
  trabajador,
  sucursal,
} = require("../../config/db");
const { Op, Sequelize } = require("sequelize");
const path = require("path");
const XLSX = require("xlsx");
const fs = require("fs");
const _ = require("lodash");

// ingresos y egreos del modulo de finanzas

// lista de ingresos y egreosos
const getIngresoEgresos = async (req, res, next) => {
  try {
    const get = await ingresos_egresos.findAll();
    return res.status(200).json({ data: get });
    next();
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
    });
    return res.status(200).json({ data: getById });
    next();
  } catch (error) {
    res.status(500).json(error);
  }
};
// crear ingreso o egreso
const postIngresoEgreso = async (req, res, next) => {
  let newSaldo;
  let info;
  try {
    const getSaldo = await saldo.findAll({
      where: { sucursal_id: req.body.sucursal_id },
    });
    const getSaldoEgreso = await saldo.findAll({
      where: { sucursal_id: req.body.sucursal_transferencia },
    });

    let objIngreso = {
      sucursal_id: req.body.sucursal_id,
      fecha: req.body.fecha,
      movimiento: "Ingreso",
      forma_pago: req.body.forma_pago,
      encargado: req.body.encargado,
      area: req.body.area,
      cantidad: req.body.cantidad,
      medida: req.body.medida,
      descripcion: req.body.descripcion,
      monto: parseFloat(req.body.monto),
      proveedor: req.body.proveedor,
      comprobante: req.body.comprobante,
      sucursal_transferencia: req.body.sucursal_transferencia,
      dni: req.body.dni,
      precio: req.body.precio,
      categoria: req.body.categoria,
      nro_comprobante: req.body.nro_comprobante,
      ingresos: getSaldo?.at(-1)?.ingresos + parseFloat(req.body.monto),
      saldo_final: getSaldo?.at(-1)?.saldo_final + parseFloat(req.body.monto),
    };
    let objEgreso = {
      sucursal_id: req.body.sucursal_id,
      fecha: req.body.fecha,
      movimiento: "Egreso",
      forma_pago: req.body.forma_pago,
      encargado: req.body.encargado,
      area: req.body.area,
      cantidad: req.body.cantidad,
      medida: req.body.medida,
      descripcion: req.body.descripcion,
      monto: parseFloat(req.body.monto),
      proveedor: req.body.proveedor,
      comprobante: req.body.comprobante,
      dni: req.body.dni,
      precio: req.body.precio,
      categoria: req.body.categoria,
      nro_comprobante: req.body.nro_comprobante,
      sucursal_transferencia: req.body.sucursal_transferencia,
      egresos: getSaldo?.at(-1)?.egresos + parseFloat(req.body.monto),
      saldo_final: getSaldo?.at(-1)?.saldo_final - parseFloat(req.body.monto),
    };
    let newSaldoIngreso = {
      ingresos: getSaldo?.at(-1)?.ingresos + parseFloat(req.body.monto),
      saldo_final: getSaldo?.at(-1)?.saldo_final + parseFloat(req.body.monto),
    };

    let newSaldoEgreso = {
      egresos: getSaldo?.at(-1)?.egresos + parseFloat(req.body.monto),
      saldo_final: getSaldo?.at(-1)?.saldo_final - parseFloat(req.body.monto),
    };
    // para registrar ingresos y egresos
    if (!req.body.sucursal_transferencia && req.body.sucursal_id) {
      if (req.body.movimiento === "Ingreso") {
        const post = await ingresos_egresos.create(objIngreso);
        const updateSaldo = await saldo.update(newSaldoIngreso, {
          where: { sucursal_id: req.body.sucursal_id },
        });
        return res
          .status(200)
          .json({ msg: "Movimiento registrado con éxito!", status: 200 });
      } else {
        const post = await ingresos_egresos.create(objEgreso);
        const updateSaldo = await saldo.update(newSaldoEgreso, {
          where: { sucursal_id: req.body.sucursal_id },
        });
        return res
          .status(200)
          .json({ msg: "Movimiento registrado con éxito!", status: 200 });
      }
    }

    // para registrar las transferencias y actualizar el saldo de cada sucursal
    if (
      req.body.movimiento === "Egreso" &&
      req.body.sucursal_transferencia &&
      req.body.sucursal_transferencia !== req.body.sucursal_id
    ) {
      let objEgresoTransferencia = {
        sucursal_id: req.body.sucursal_id,
        fecha: req.body.fecha,
        movimiento: req.body.movimiento,
        forma_pago: req.body.forma_pago,
        encargado: req.body.encargado,
        area: req.body.area,
        cantidad: req.body.cantidad,
        medida: req.body.medida,
        descripcion: req.body.descripcion,
        monto: req.body.monto,
        proveedor: req.body.proveedor,
        comprobante: req.body.comprobante,
        sucursal_transferencia: req.body.sucursal_transferencia,
        dni: req.body.dni,
        egresos: getSaldo?.at(-1)?.egresos + parseFloat(req.body.monto),
        saldo_final:
          getSaldo?.at(-1)?.saldo_final - -parseFloat(req.body.monto),
      };
      let objIngresoTransferencia = {
        sucursal_id: req.body.sucursal_transferencia,
        fecha: req.body.fecha,
        movimiento: "Ingreso",
        forma_pago: req.body.forma_pago,
        encargado: req.body.encargado,
        area: req.body.area,
        cantidad: req.body.cantidad,
        medida: req.body.medida,
        descripcion: req.body.descripcion,
        monto: req.body.monto,
        proveedor: req.body.proveedor,
        comprobante: req.body.comprobante,
        sucursal_transferencia: req.body.sucursal_transferencia,
        dni: req.body.dni,
        ingresos: getSaldoEgreso?.at(-1)?.ingresos + parseInt(req.body.monto),
        saldo_final:
          getSaldoEgreso?.at(-1)?.saldo_final + parseFloat(req.body.monto),
      };
      let newSaldoEgresoTransferencia = {
        egresos: getSaldo?.at(-1)?.egresos + parseFloat(req.body.monto),
        saldo_final: getSaldo?.at(-1)?.saldo_final - parseFloat(req.body.monto),
      };
      let newSaldoIngresoTransferencia = {
        ingresos: getSaldoEgreso?.at(-1)?.ingresos + parseFloat(req.body.monto),
        saldo_final:
          getSaldoEgreso?.at(-1)?.saldo_final + parseFloat(req.body.monto),
      };
      const postEgreso = await ingresos_egresos.create(objEgresoTransferencia);
      const postIngreso = await ingresos_egresos.create(
        objIngresoTransferencia
      );

      const updateSaldoEgreso = await saldo.update(
        newSaldoEgresoTransferencia,
        {
          where: { sucursal_id: req.body.sucursal_id },
        }
      );
      const updateSaldoIngreso = await saldo.update(
        newSaldoIngresoTransferencia,
        {
          where: { sucursal_id: req.body.sucursal_transferencia },
        }
      );

      return res
        .status(200)
        .json({ msg: "Movimiento registrado con éxito!", status: 200 });
    }

    next();
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

    if (req.body.movimiento === "Ingreso") {
      let saldoInicial = parseFloat(getSaldoOrigen?.at(-1)?.saldo_inicial);
      let saldoFinal = parseFloat(getSaldoOrigen?.at(-1)?.saldo_final);
      let ingresoActual = parseFloat(getSaldoOrigen?.at(-1)?.ingresos);
      let montoAnterior = parseFloat(getIngresos?.at(-1)?.monto);
      let montoNuevo = parseFloat(req.body.monto);
      let newSaldoIngreso = {
        ingresos: ingresoActual - montoAnterior + montoNuevo,
        saldo_final: saldoFinal - montoAnterior + montoNuevo,
      };

      let update = await ingresos_egresos.update(req.body, {
        where: { id: req.body.id },
      });
      const updateSaldo = await saldo.update(newSaldoIngreso, {
        where: { sucursal_id: req.body.sucursal_id },
      });
      return res
        .status(200)
        .json({ msg: "Movimiento actualizado con éxito!", status: 200 });
    }
    if (req.body.movimiento === "Egreso" && !req.body.sucursal_transferencia) {
      let saldoInicial = parseFloat(getSaldoOrigen?.at(-1)?.saldo_inicial);
      let saldoFinal = parseFloat(getSaldoOrigen?.at(-1)?.saldo_final);
      let egresoActual = parseFloat(getSaldoOrigen?.at(-1)?.egresos);
      let montoAnterior = parseFloat(getIngresos?.at(-1)?.monto);
      let montoNuevo = parseFloat(req.body.monto);
      let newSaldoEgreso = {
        egresos: egresoActual - montoAnterior + montoNuevo,
        saldo_final: saldoFinal + montoAnterior - montoNuevo,
      };

      let update = await ingresos_egresos.update(req.body, {
        where: { id: req.body.id },
      });
      const updateSaldo = await saldo.update(newSaldoEgreso, {
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

      console.log(req.body);

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
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteIngresoEgreso = async (req, res, next) => {
  let id = req.params.id;
  try {
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
      next();
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
    next();
  } catch (error) {
    res.status(500).json(error);
  }
};
// descargar excel de ingresos y egresos
const convertJsonToExcel = async (req, res, next) => {
  let id = req.params.id
  try{
  let saldoInicial = await saldo.findOne({
    where: { sucursal_id: id },
  });

  if (!saldoInicial) {
    throw new Error("No se encontro la sucursal." );
  }

  saldoInicial = parseFloat(saldoInicial.saldo_inicial); 
  
  const transacciones = await ingresos_egresos.findAll({
    where: {
      sucursal_id: id,
      fecha: {
        [Op.lte]: req.query.fecha_fin,
      },
    },
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
        transaccion.ingresos ? Number(parseFloat(transaccion.monto).toFixed(2)) : "",
        transaccion.egresos ? Number(parseFloat(transaccion.monto).toFixed(2)) : "",
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

    //Consejo administracion
    const workSheetData1 = [workSheetColumnsName, ...allMovimientos];
    const workSheet1 = XLSX.utils.aoa_to_sheet(workSheetData1);
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
    return
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
        movimientosPorMesYAnio[clave] = { ingresos: 0, egresos: 0, mes: getMonthName(mes), anio: anio };
      }

      let monto = parseFloat(item.monto);
      if (item.movimiento === "Ingreso" && !isNaN(monto)) {
        movimientosPorMesYAnio[clave].ingresos += monto;
      } else if (item.movimiento === "Egreso" && !isNaN(monto)) {
        movimientosPorMesYAnio[clave].egresos += monto;
      }
    });
    console.log(movimientosPorMesYAnio);

    const resultado = Object.values(movimientosPorMesYAnio).map(item => {
      return { 
        ...item, 
        total: item.ingresos - item.egresos
      }
    }).filter(item => item.total !== 0);

    return res.status(200).json({ data: resultado });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
const getMonthName = (monthIndex) => {
  const monthNames = ["ene", "feb", "mar", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
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
  getTrabajadorFinanza,
  getSaldoMensual,
};
