const {
  asistencia,
  contrato,
  trabajador,
  trabajadorAsistencia,
  trabajador_contrato,
} = require("../../config/db");
const XLSX = require("xlsx");
const { Op, where } = require("sequelize");
const dayjs = require("dayjs");

const getAsistencia = async (req, res, next) => {
  try {
    const all = await asistencia.findAll();
    return res.status(200).json({ data: all });
  } catch (error) {
    res.status(500).json();
  }
};

const updateAsistencia = async (req, res, next) => {
  let id = req.params.id;

  try {
    const updateAsistencia = await asistencia.update(req.body, {
      where: { id: id },
    });
    return res.status(200).json({ msg: "Actualizado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

// para convertir las fechas como nro de serie del excel a fecha normal
function excelSerialDateToJSDate(serial) {
  var days = serial - (25567 + 2);
  var date = new Date(days * 24 * 60 * 60 * 1000);
  return date;
}

//para subir el excel de asistencias
const getExcelAsistencia = async (req, res, next) => {
  try {
    const workbook = XLSX.readFile("./upload/asistencia.xlsx");
    const workbookSheets = workbook.SheetNames;

    const index = workbookSheets.indexOf("Reporte de Excepciones");
    const sheet = workbookSheets[index];
    const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

    const result = dataExcel.map((v) =>
      Object.entries(v).reduce(
        (acc, [key, value]) =>
          Object.assign(acc, { [key.replace(/\s+/g, "_")]: value }),
        {}
      )
    );

    const fecha = dayjs(req.body.fecha, "YYYY-MM-DD").format("YYYY-MM-DD");
    // const fechaBd = dayjs(fechaActual).format("YYYY-MM-DD");

    //para darle un formato usable a la data del excel
    const jsonFormat = result
      .slice(3)
      .map((item, i) => {
        let fechaCorrecta = item.__EMPTY_2;

        // Check if the date is in Excel serial number format
        if (!isNaN(fechaCorrecta) && fechaCorrecta > 25567) {
          const dateObject = excelSerialDateToJSDate(fechaCorrecta);
          fechaCorrecta = dayjs(dateObject).format("YYYY-MM-DD");
        } else {
          fechaCorrecta = dayjs(fechaCorrecta, [
            "YYYY-MM-DD",
            "DD-MM-YYYY",
            "MM-DD-YYYY",
          ]).format("YYYY-MM-DD");
        }
        return {
          dni: item.Reporte_de_Excepciones?.toString(),
          nombre: item.__EMPTY,
          fecha: fechaCorrecta,
          entrada: item.__EMPTY_3 === undefined ? "" : item.__EMPTY_3,
          salida: item.__EMPTY_4 === undefined ? "" : item.__EMPTY_4,
        };
      })
      .filter((item) => item.dni);
    //obtengo solo las asistencias del dia actual que se encuentran en el excel
    const asistenciaExcelDiaActual = jsonFormat.filter(
      (item) => item.fecha === fecha
    );
    //creo array de dnis para hacer busqueda
    const dni = jsonFormat.map((item) => item?.dni).flat();
    const filtereDni = [...new Set(dni?.map((dni) => dni?.toString()))];
    //obtener el id de la fecha para la asistencia
    const idAsistencia = await asistencia.findAll({
      //aqui fechaBD
      where: { fecha: fecha },
    });

    //todos los trabajadores con dni del excel
    const getTrabajadores = await trabajador.findAll({
      attributes: { exclude: ["usuarioId"] },
      where: { dni: filtereDni },
      include: [
        {
          model: trabajador_contrato,
          where: { estado: "Activo" },
          attributes: ["id"],
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
            },
            {
              model: trabajadorAsistencia,
              attributes: ["id", "asistencia"],
              include: [
                {
                  model: asistencia,
                  where: { fecha: fecha },
                  attributes: ["fecha"],
                },
              ],
            },
          ],
        },
      ],
    });

    const idFechaAsistencia = parseInt(idAsistencia.map((item) => item.id));

    let hora_bd = idAsistencia.map((item) => item.hora_ingreso).toString();
    const trabajadorTieneAsistencia = await trabajadorAsistencia.findAll({
      attributes: { exclude: ["trabajadorDni", "asistenciumId"] },
      where: { trabajador_id: filtereDni, asistencia_id: idFechaAsistencia },
    });
    //json con formato para guardar en la db de todos los trabajadores del excel

    const guardarTrabajadores = asistenciaExcelDiaActual
      .map((item) => {
        const trabajadorData = getTrabajadores.find((t) => t.dni == item.dni);
        const contrato = trabajadorData?.trabajador_contratos[0].id;
        const fecha = "2023-04-20T";
        const fecha_hora_bd = new Date(fecha + hora_bd);
        const fecha_entrada = new Date(fecha + item.entrada);
        const diferencia_minutos =
          (fecha_hora_bd.getTime() - fecha_entrada.getTime()) / 60000;
        const umbral_tardanza = 15;
        const decimalTime = item.entrada;
        const hours = Math.floor(decimalTime * 24);
        const minutes = Math.floor((decimalTime * 24 - hours) * 60);

        const timeString = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
        return {
          asistencia_id: idFechaAsistencia,
          trabajador_id: item?.dni?.toString(),
          asistencia: item.entrada ? "Asistio" : "Falto",
          hora_ingreso: timeString,
          tarde: diferencia_minutos > umbral_tardanza ? "Si" : "No",
          trabajador_contrato_id: contrato || null,
        };
      })
      
      console.log(guardarTrabajadores);
    let responseMessages = [];
    // Verificamos cuáles de los trabajadores filtrados tienen asistencia y cuáles no
    const trabajadoresAsistencia = guardarTrabajadores.reduce(
      (acumulador, item) => {
        const tieneAsistencia = trabajadorTieneAsistencia.some(
          (asistencia) =>
            asistencia.trabajador_id.toString() ===
            item.trabajador_id.toString()
        );
        if (tieneAsistencia) {
          acumulador.conAsistencia.push(item);
        } else {
          acumulador.sinAsistencia.push(item);
        }

        return acumulador;
      },
      { conAsistencia: [], sinAsistencia: [] }
    );
    console.log(trabajadoresAsistencia.conAsistencia);
    console.log(trabajadoresAsistencia.sinAsistencia);
    if (trabajadoresAsistencia.conAsistencia.length > 0) {
      // Actualizar asistencias de trabajadores con asistencia existente
      const resConAsis = await Promise.all(
        trabajadoresAsistencia.conAsistencia.map(async (trabajador) => {
          await trabajadorAsistencia.update(
            {
              asistencia: trabajador.asistencia,
              hora_ingreso: trabajador.hora_ingreso,
              tarde: trabajador.tarde,
              trabajador_contrato_id: trabajador.trabajador_contrato_id
            },
            {
              where: {
                trabajador_id: trabajador.trabajador_id,
                asistencia_id: idFechaAsistencia,
              },
            }
          );
        })
      );
      responseMessages.push(`Se actualizó ${resConAsis.length} asistencia(s).`);
    }

    if (trabajadoresAsistencia?.sinAsistencia.length > 0) {
      // Crear nuevas asistencias para trabajadores sin asistencia existente
      const resSinAsis = await trabajadorAsistencia.bulkCreate(
        trabajadoresAsistencia.sinAsistencia
      );

      responseMessages.push(`Se añadió ${resSinAsis.length} asistencia(s).`);
    }
    let responseMessage;
    if (responseMessages.length === 0) {
      responseMessage =
        "No se encontraron registros de asistencia en el excel para esta fecha.";
      return res.status(500).json({
        msg: responseMessage,
        status: 500,
      });
    } else if (responseMessages.length === 1) {
      responseMessage = responseMessages[0];
    } else {
      responseMessage = responseMessages.join("      \n ");
    }

    return res.status(200).json({
      msg: responseMessage,
      status: 200,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Hubo un error al registrar las asistencias.",
      status: 500,
    });
  }
};

const getTrabajadorAsistencia = async (req, res, next) => {
  let id = req.params.id;
  try {
    const get = await trabajador.findAll({
      attributes: [
        "dni",
        "apellido_paterno",
        "apellido_materno",
        "asociacion_id",
        "nombre",
      ],
      include: [
        {
          model: trabajador_contrato,
          where: { estado: "Activo" },
          include: [
            {
              model: contrato,
              attributes: ["id"],
            },
            {
              model: trabajadorAsistencia,
              attributes: ["asistencia"],
              include: [
                {
                  model: asistencia,
                  where: { id: id },
                  attributes: ["fecha", "hora_ingreso"],
                },
              ],
            },
          ],
        },
      ],
    });

    const jsonFinal = get
      ?.map((item, i) => {
        const trabajador_asistencia =
          item?.trabajador_contratos[0]?.trabajador_asistencia;

        return {
          dni: item?.dni,
          apellido_paterno: item?.apellido_paterno,
          apellido_materno: item?.apellido_materno,
          nombre: item?.nombre,
          asociacion_id: item?.asociacion_id,
          trabajador_asistencia: trabajador_asistencia,
        };
      })
      .sort((a, b) => {
        // Si a.asociacion_id es nulo o vacío, lo coloca al principio
        if (!a.asociacion_id) {
          return -1;
        }
        // Si b.asociacion_id es nulo o vacío, lo coloca al final
        if (!b.asociacion_id) {
          return 1;
        }
        // Si ambos son nulos o vacíos, no los mueve de posición
        if (!a.asociacion_id && !b.asociacion_id) {
          return 0;
        }
        // Si ambos tienen un valor de asociacion_id, los compara numéricamente
        return a.asociacion_id - b.asociacion_id;
      });
    const finalConId = jsonFinal.map((item, i) => {
      return { id: i + 1, ...item };
    });

    return res.status(200).json({ data: finalConId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error, status: 500 });
  }
};

// para crear el registro de asistencia diaria
const postAsistencia = async (req, res, next) => {
  let info = {
    fecha: req.body.fecha,
    campamento_id: req.body.campamento_id,
    hora_ingreso: req.body.hora_ingreso.toString(),
  };

  try {
    const all = await asistencia.findAll({ raw: true });

    const filter = all.filter((item) => item.fecha === info.fecha);

    if (filter.length > 0) {
      return res
        .status(500)
        .json({ msg: "No se pudo registrar.", status: 500 });
    } else if (filter.length === 0) {
      const asis = await asistencia.create(info);
      return res
        .status(200)
        .json({ msg: "Se añadio correctamente.", status: 200 });
    }
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo registrar.", status: 500 });
  }
};

// para subir las asistencias de trabajador un por uno
const postTrabajadorAsistencia = async (req, res, next) => {
  const info = {
    asistencia_id: req.body.asistencia_id,
    trabajador_id: req.body.trabajador_id,
    asistencia: req.body.asistencia,
    trabajador_contrato_id: null,
  };

  try {
    const traba = await trabajador_contrato.findOne({
      where: { trabajador_dni: info.trabajador_id, estado: "Activo" },
    });
    const getAsistencia = await trabajadorAsistencia.findOne({
      raw: true,
      attributes: { exclude: ["trabajadorDni", "asistenciumId"] },
      where: {
        asistencia_id: info.asistencia_id,
        trabajador_id: info.trabajador_id,
      },
    });

    const asistenciaData = await asistencia.findOne({
      where: { id: info.asistencia_id },
    });

    if (!asistenciaData) {
      return res
        .status(404)
        .json({ msg: "La asistencia no existe", status: 404 });
    }

    const fechaAsistencia = new Date(asistenciaData.fecha);
    const fechaActual = new Date();
    const diferenciaDias =
      (fechaActual.getTime() - fechaAsistencia.getTime()) / (1000 * 3600 * 24);

    // if (diferenciaDias > 30) {
    //   return res.status(403).json({
    //     msg: "No se puede registrar la asistencia, han pasado más de 2 días.",
    //     status: 403,
    //   });
    // }
    if (traba) {
      info.trabajador_contrato_id = traba.id;
    }
    if (getAsistencia) {
    await trabajadorAsistencia.update(info, {
        where: {
          asistencia_id: info.asistencia_id,
          trabajador_id: info.trabajador_id,
        },
      });
      return res
        .status(200)
        .json({ msg: "Actualizado con éxito!", status: 200 });
    } else if (!getAsistencia) {
      await trabajadorAsistencia.create(info);
      return res
        .status(200)
        .json({ msg: "Asistencia registrada con éxito!", status: 200 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo registrar la asistencia.", status: 500 });
  }
};

// para actualizar la asistencia del trabajador uno por uno
const updateTrabajadorAsistencia = async (req, res, next) => {
  const info = {
    asistencia_id: req.body.asistencia_id,
    trabajador_id: req.body.trabajador_id,
    asistencia: req.body.asistencia,
    trabajador_contrato_id: null,
  };

  try {
    const traba = await trabajador_contrato.findOne({
      where: { trabajador_dni: info.trabajador_id, estado: "Activo" },
    });

    console.log(traba);
    info.trabajador_contrato_id = traba.id;
    await trabajadorAsistencia.update(info);
    return res.status(200).json({ msg: "Actualizado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

// para eliminar la asistencia
const deleteAsistencia = async (req, res, next) => {
  let id = req.params.id;
  try {
    await trabajadorAsistencia.destroy({
      where: { asistencia_id: id },
    });
    await asistencia.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Eliminada con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  getAsistencia,
  postAsistencia,
  postTrabajadorAsistencia,
  updateTrabajadorAsistencia,
  deleteAsistencia,
  getTrabajadorAsistencia,
  getExcelAsistencia,
  updateAsistencia,
};
