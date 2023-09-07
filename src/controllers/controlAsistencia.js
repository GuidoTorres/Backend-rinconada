const {
  contrato,
  trabajador,
  trabajadorAsistencia,
  trabajador_contrato,
  asistencia,
  asociacion,
  evaluacion,
  teletrans,
  aprobacion_contrato_pago,
  usuario,
} = require("../../config/db");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

function contarDomingos(fechaInicio, fechaFin) {
  let contador = 0;
  let fechaActual = fechaInicio;

  while (fechaActual.isBefore(fechaFin)) {
    if (fechaActual.day() === 0) {
      contador++;
    }
    fechaActual = fechaActual.add(1, "day");
  }

  return contador;
}
// para calcular la cantidad de dias que debe trabajadr en base al contrato
function calcularCantidadReal(trabajadorAsistencias) {
  let cantidadReal = 0;
  if (!trabajadorAsistencias) {
    return;
  }
  trabajadorAsistencias.forEach((asistencia) => {
    const estadoAsistencia = asistencia.asistencia;
    if (estadoAsistencia === "Asistio" || estadoAsistencia === "Comisión") {
      cantidadReal++;
    }
  });
  return cantidadReal;
}

// para crear las aprobaciones en base a las asistencias
const getPlanillaAprobacion = async () => {
  try {
    const trabajadores = trabajador.findAll({
      where: {
        asociacion_id: { [Op.is]: null },
        deshabilitado: { [Op.not]: true },
      },
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajador_contrato,
          attributes: { exclude: ["contrato_id"] },
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
              where: {
                finalizado: { [Op.not]: true },
                suspendido: { [Op.not]: true },
              },
              include: [
                { model: teletrans },
                { model: aprobacion_contrato_pago },
              ],
            },
          ],
        },
        {
          model: trabajadorAsistencia,
          attributes: { exclude: ["trabajadorDni", "asistenciumId"] },
          include: [{ model: asistencia, order: [["fecha", "ASC"]] }],
        },
      ],
    });

    const asociaciones = asociacion.findAll({
      include: [
        {
          model: contrato,
          attributes: { exclude: ["contrato_id"] },
          where: {
            finalizado: { [Op.not]: true },
          },
          include: [
            { model: teletrans },
            {
              model: aprobacion_contrato_pago,
              attributes: { exclude: ["fecha"] },
            },
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
                        exclude: ["trabajadorDni", "asistenciumId"],
                      },
                      include: [{ model: asistencia }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const usuarios = await usuario.findAll({
      where: {
        cargo_id: [15, 44]
      }
    });

    const [trabajadorFetch, asociacionFetch] = await Promise.all([
      trabajadores,
      asociaciones,
    ]);

    const asociacionData = asociacionFetch
      .map((asociacion) => {
        return asociacion.contratos.flatMap((contrato) => {
          let fechaInicioData = dayjs(contrato.fecha_inicio).toDate();
          let fechaFinData =
            dayjs(contrato.fecha_fin_estimada).toDate() ||
            dayjs(contrato.fecha_fin).toDate();

          let fechaInicio = dayjs(contrato.fecha_inicio).startOf("day");
          let fechaFin =
            dayjs(contrato.fecha_fin_estimada).startOf("day") ||
            dayjs(contrato.fecha_fin).startOf("day");

          if (fechaInicioData.getTime() > fechaFinData.getTime()) {
            return [];
          }
          let subarrays = [];
          const contratoData = contrato;

          const trabajadores = contrato.trabajador_contratos.map(
            (tc) => tc.trabajador
          );
          let trabajadorMenorCodigo;
          let asistencias
          if (trabajadores && trabajadores.length > 0) {
            trabajadorMenorCodigo = trabajadores.reduce((prev, curr) => {
              return prev.codigo_trabajador < curr.codigo_trabajador
                ? prev
                : curr;
            });

            asistencias = trabajadorMenorCodigo.trabajador_asistencia
            .filter((asistencia) => {
              const asistenciaFecha = dayjs(asistencia?.asistencium?.fecha, [
                "YYYY-MM-DD",
                "YYYY-MM-DD HH:mm:ss",
              ]);
              return (
                (asistenciaFecha.isSame(fechaInicio) ||
                  asistenciaFecha.isAfter(fechaInicio)) &&
                (asistenciaFecha.isSame(fechaFin) ||
                  asistenciaFecha.isBefore(fechaFin)) &&
                ["Asistio", "Comisión"].includes(asistencia.asistencia)
              );
            })
            .sort(
              (a, b) =>
                new Date(a.asistencium.fecha) - new Date(b.asistencium.fecha)
            );
          } else {
            // set trabajadorMenorCodigo to your default value here
            trabajadorMenorCodigo = null;
            asistencias = [] // or some default value
          }



          let contadorAsistencias = 0;
          let subAsistencias = [];
          let fechaInicioSubarray = null;
          let fechaFinSubarray = null;
          let subarrayId = 1;
          let currentDate = dayjs(contrato.fecha_inicio);
          let indexAsistencia = 0;
          while (
            currentDate.isBefore(fechaFin) ||
            currentDate.isSame(fechaFin)
          ) {
            const asistencia = asistencias[indexAsistencia];

            if (!asistencia) {
              currentDate = currentDate.add(1, "day");
              continue;
            }
            contadorAsistencias++;
            subAsistencias.push(asistencia);
            if (contadorAsistencias === 1) {
              fechaInicioSubarray = asistencia.asistencium.fecha;
            }
            fechaFinSubarray = asistencia.asistencium.fecha;
            if (contadorAsistencias === 15) {
              subarrays.push({
                subArray_id: subarrayId,
                asociacion_id: asociacion?.id,
                nombre: asociacion?.nombre,
                fecha_inicio: dayjs(fechaInicioSubarray)?.format("DD-MM-YYYY"),
                fecha_fin: dayjs(fechaFinSubarray)?.format("DD-MM-YYYY"),
                asistencia: contadorAsistencias,
                volquete: contrato?.dataValues.teletrans?.at(-1)?.volquete || 0,
                teletran:
                  contrato?.dataValues?.teletrans?.at(-1)?.teletran || 0,
                total: contrato?.dataValues?.teletrans?.at(-1)?.saldo,
                contrato_id: contrato?.dataValues?.id,
                estado: contrato?.dataValues?.aprobacion_contrato_pagos
                  ?.filter((item) => item.subarray_id == subarrayId)
                  .at(0)?.estado,
                aprobacion_id: contrato?.dataValues?.aprobacion_contrato_pagos
                  ?.filter((item) => item.subarray_id == subarrayId)
                  .at(0)?.id,
                firma_jefe: contrato?.dataValues?.aprobacion_contrato_pagos
                  ?.filter((item) => item.subarray_id == subarrayId)
                  .at(0)?.firma_jefe,
                firma_gerente: contrato?.dataValues?.aprobacion_contrato_pagos
                  ?.filter((item) => item.subarray_id == subarrayId)
                  .at(0)?.firma_gerente,
                jefe:usuarios[0].nombre,
                gerente:usuarios[1].nombre
              });

              contadorAsistencias = 0;
              subAsistencias = [];
              fechaInicioSubarray = null;
              fechaFinSubarray = null;
              subarrayId++;
            }
            currentDate = currentDate.add(1, "day");
            indexAsistencia++;
          }
          return subarrays;
        });
      })
      .filter((item) => item.length > 0)
      .flat();

    const filterContrato = trabajadorFetch.filter(
      (trabajador) =>
        trabajador.trabajador_contratos.length > 0 &&
        trabajador.trabajador_asistencia.length > 0
    );

    const aprobacionFilter = []; // Array para almacenar los datos filtrados
    let subarrayId = 1; // ID del subarray actual
    const subarrayIdsPorTrabajador = {}; // Objeto para almacenar el ID del subarray por trabajador

    filterContrato.forEach((trabajador) => {
      const contrato = trabajador.trabajador_contratos[0].contrato;
      const fechaInicioContrato = dayjs(contrato.fecha_inicio).startOf("day");
      const fechaInicioData = dayjs(contrato.fecha_inicio).startOf("day");
      const fechaFinData = (
        contrato.fecha_fin_estimada
          ? dayjs(contrato.fecha_fin_estimada)
          : dayjs(contrato.fecha_fin)
      ).startOf("day");

      const asistencias = trabajador?.trabajador_asistencia
        ?.filter((asistencia) => {
          const asistenciaFecha = dayjs(asistencia?.asistencium?.fecha, [
            "YYYY-MM-DD",
            "YYYY-MM-DD HH:mm:ss",
          ]);

          // Filtrar las asistencias que están dentro del rango de fechas del contrato
          return (
            (asistencia.asistencia === "Asistio" ||
              asistencia.asistencia === "Comisión") &&
            (asistenciaFecha.isSame(fechaInicioData) ||
              asistenciaFecha.isAfter(fechaInicioData)) &&
            (asistenciaFecha.isSame(fechaFinData) ||
              asistenciaFecha.isBefore(fechaFinData))
          );
        })
        .sort((a, b) => {
          const fechaA = dayjs(a.asistencium.fecha, "DD-MM-YYYY");
          const fechaB = dayjs(b.asistencium.fecha, "DD-MM-YYYY");
          return fechaA - fechaB;
        });

      const numAsistencias = asistencias?.length;

      if (numAsistencias >= 15) {
        let contador = 0; // Contador de asistencias
        let subAsistencias = []; // Array de asistencias del subarray
        let fechaInicio = null; // Fecha de inicio del subarray
        let fechaFin = null; // Fecha de fin del subarray
        let currentDate = fechaInicioContrato; // Fecha actual para iterar
        let subarrayCount = 0;
        let splitDaySet = false;
        let splitDay;
        let initialSplitDaySet = false;

        // splitDay = fechaInicioContrato.daysInMonth() === 31 ? 16 : 15;

        while (
          currentDate.isBefore(fechaFinData) ||
          currentDate.isSame(fechaFinData)
        ) {
          const asistencia = asistencias.find((asistencia) => {
            const asistenciaFecha = dayjs(asistencia.asistencium.fecha);
            return asistenciaFecha.isSame(currentDate, "day");
          });

          if (!asistencia) {
            // Si no hay asistencia para la fecha actual, pasar al siguiente día
            currentDate = currentDate.add(1, "day");
            continue;
          }

          if (
            asistencia.asistencia === "Asistio" ||
            asistencia.asistencia === "Comisión"
          ) {
            contador++; // Incrementar el contador de asistencias
            subAsistencias.push(asistencia); // Agregar la asistencia al subarray
            if (contador === 1) {
              fechaInicio = asistencia.asistencium.fecha; // Establecer la fecha de inicio del subarray
            }

            if (contrato.tareo === "Lunes a sabado") {
              if (contador === 15) {
                fechaFin = asistencia.asistencium.fecha; // Establecer la fecha de fin del subarray
                if (!subarrayIdsPorTrabajador.hasOwnProperty(trabajador.dni)) {
                  subarrayIdsPorTrabajador[trabajador.dni] = 1; // Inicializar el ID del subarray para el trabajador actual
                } else {
                  subarrayIdsPorTrabajador[trabajador.dni]++; // Incrementar el ID del subarray para el trabajador actual
                }
                if (contrato.tipo_contrato !== "Planilla") {
                  
                  // Agregar los datos del subarray a aprobacionFilter
                  crearSubArray(
                    aprobacionFilter,
                    subarrayIdsPorTrabajador,
                    trabajador,
                    contador,
                    fechaInicio,
                    fechaFin,
                    subarrayId,
                    splitDay,
                    usuarios
                  );
                  subAsistencias = [];
                  fechaInicio = null;
                  fechaFin = null;
                  subarrayId++; // Incrementar el ID del subarray
                  contador = 0;
                }
                // Reiniciar el contador, el array de asistencias y las fechas del subarray
              }
              currentDate = currentDate.add(1, "day"); // Avanzar al siguiente día

            } else if (contrato.tareo === "Mes cerrado") {
              // fechaInicio => la primer fecha con asistencia
              let fechaAsistencia = dayjs(asistencia.asistencium.fecha); // fecha de asistencia de cada trajador
              let daysInCurrentAsistenciaMonth =
                dayjs(fechaInicio).daysInMonth();
              let currentMonth = fechaAsistencia.month();



                if (initialSplitDaySet === false) {
                  splitDay = daysInCurrentAsistenciaMonth === 31 ? 16 : 15;
                  initialSplitDaySet = true;
                }
              if(contador === 1){
                fechaInicio = asistencia.asistencium.fecha;
              }

              if (contador == splitDay) {
                fechaFin = asistencia.asistencium.fecha;
                if (!subarrayIdsPorTrabajador.hasOwnProperty(trabajador.dni)) {
                  subarrayIdsPorTrabajador[trabajador.dni] = 1;
                } else {
                  subarrayIdsPorTrabajador[trabajador.dni]++;
                }

                if (contrato.tipo_contrato !== "Planilla") {
                  crearSubArray(
                    aprobacionFilter,
                    subarrayIdsPorTrabajador,
                    trabajador,
                    contador,
                    fechaInicio,
                    fechaFin,
                    subarrayId,
                    splitDay,
                    usuarios
                  );

                  subarrayCount++;


                  // Recalcular splitDay
                  if (subarrayCount % 2 === 0) {
                    // Si acabamos de completar el segundo subarray, entonces necesitamos calcular el splitDay para el próximo mes

                    fechaInicio = fechaAsistencia
                    .add(1, "day")
                    .format("YYYY-MM-DD");
                    const daysInNextMonth = dayjs(fechaInicio).daysInMonth();
                    splitDay = daysInNextMonth === 31 ? 16 : 15;
                    initialSplitDaySet = true;
                    subarrayCount = 0;
                  } else {
                    // Si acabamos de completar el primer subarray, entonces necesitamos calcular el splitDay para el segundo subarray del mismo mes
                    if(subarrayCount === 1) {

                      // Si acabamos de completar el primer subarray, entonces necesitamos calcular el splitDay para el segundo subarray del mismo mes
                      splitDay = dayjs(fechaInicio).daysInMonth() - splitDay;
                      fechaInicio = fechaAsistencia
                      .add(1, "day")
                      .format("YYYY-MM-DD");
                  } 
                 }
                  contador = 0;
                }

              }

              currentDate = currentDate.add(1, "day");

            }
          }
        }
      }
    });

    // Finalizado el bucle forEach

    if (asociacionData.length > 0) {
      const data = asociacionData.map((item) => {
        return {
          subarray_id: item.subArray_id,
          nombre: item.nombre,
          fecha_inicio: item.fecha_inicio,
          fecha_fin: item.fecha_fin,
          asistencia: item.asistencia,
          volquete: item.volquete,
          teletran: item.teletran ? item.teletran : 0,
          dias_laborados: item.asistencia,
          contrato_id: item.contrato_id,
          asociacion_id: item.asociacion_id,
          jefe: item.jefe,
          gerente: item.gerente
        };
      });

      for (const aprobacion of data) {
        await guardarAprobacion(aprobacion);
      }
    }
    if (aprobacionFilter.length > 0) {
      const data = aprobacionFilter.map((item) => {
        return {
          subarray_id: item.subArray_id,
          nombre: item.nombre,
          fecha_inicio: item.fecha_inicio,
          fecha_fin: item.fecha_fin,
          asistencia: item.asistencia,
          volquete: item.volquete,
          teletran: item.teletran ? item.teletran : 0,
          dias_laborados: item.asistencia,
          contrato_id: item.contrato_id,
          dni: item.dni,
          jefe: item.jefe,
          gerente: item.gerente
        };
      });

      for (const aprobacion of data) {
        await guardarAprobacion(aprobacion);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// para generar las aprobaciones y guardarlas en la bd
async function guardarAprobacion(aprobacion) {
  const existingRecord = await aprobacion_contrato_pago.findOne({
    where: {
      subarray_id: aprobacion.subarray_id,
      contrato_id: aprobacion.contrato_id,
    },
  });

  if (!existingRecord) {
    await aprobacion_contrato_pago.create(aprobacion);
  }
}
// crea un subarray o quincena de cada aprobacion
function crearSubArray(
  aprobacionFilter,
  subarrayIdsPorTrabajador,
  trabajador,
  contador,
  fechaInicio,
  fechaFin,
  subarrayId,
  splitDay,
  usuarios
) {
  aprobacionFilter.push({
    subArray_id: subarrayIdsPorTrabajador[trabajador.dni],
    dni: trabajador.dni,
    nombre:
      trabajador.apellido_paterno +
      " " +
      trabajador.apellido_materno +
      " " +
      trabajador.nombre,
    celular: trabajador.telefono,
    fecha_inicio: dayjs(fechaInicio).format("DD-MM-YYYY"),
    fecha_fin: dayjs(fechaFin).format("DD-MM-YYYY"),
    volquete:
      trabajador.trabajador_contratos[0].contrato?.teletrans?.at(-1)?.volquete,
    teletran:
      trabajador.trabajador_contratos[0].contrato?.teletrans?.at(-1)?.teletrans,
    total:
      trabajador.trabajador_contratos[0].contrato?.teletrans?.at(-1)?.total,
    contrato_id: trabajador.trabajador_contratos[0].contrato?.id,
    asistencia: contador,
    aprobacion_id:
      trabajador.trabajador_contratos[0].contrato?.aprobacion_contrato_pagos
        ?.filter((item) => item.subarray_id == subarrayId)
        .at(0)?.id,
    firma_jefe:
      trabajador.trabajador_contratos[0].contrato?.aprobacion_contrato_pagos
        ?.filter((item) => item.subarray_id == subarrayId)
        .at(0)?.firma_jefe,
    firma_gerente:
      trabajador.trabajador_contratos[0].contrato?.aprobacion_contrato_pagos
        ?.filter((item) => item.subarray_id == subarrayId)
        .at(0)?.firma_gerente,
    jefe:usuarios[0].nombre,
    gerente:usuarios[1].nombre
  });
}

//Para finalizar los contratos de las asocaciones si se completan las asistencias
const asociacionData = async () => {
  try {
    // Obtén todos los contratos activos
    const contratosActivos = await contrato.findAll({
      where: {
        asociacion_id: { [Op.not]: null },
        finalizado: { [Op.not]: true },
      },
      attributes: { exclude: ["contrato_id"] },
      include: [
        {
          model: asociacion,
          include: [
            {
              model: trabajador,
              order: [["codigo_trabajador", "ASC"]],
              attributes: { exclude: ["usuarioId"] },
              include: [
                {
                  model: trabajadorAsistencia,
                  attributes: { exclude: ["trabajadorDni", "asistenciumId"] },
                  include: [{ model: asistencia }],
                },
                { model: evaluacion },
              ],
            },
          ],
        },
      ],
    });

    const fechaUpdatePromises = [];
    const finalizarPromises = [];
    const contratosArray = [];
    for (const contrato of contratosActivos) {
      let trabajadorAsistencias = contrato.asociacion.trabajadors.sort((a, b) =>
        a.codigo_trabajador.localeCompare(b.codigo_trabajador)
      )[0];

      if (!trabajadorAsistencias) continue;
      let asistencias = trabajadorAsistencias.trabajador_asistencia.sort(
        (a, b) => new Date(a.asistencium.fecha) - new Date(b.asistencium.fecha)
      ); // Accede a las asistencias del trabajador
      let cantidadEstimada = 0;
      let cantidadReal = 0;
      let fechaEstimada = dayjs(contrato.fecha_fin).startOf("day");
      let fechaFinal =
        dayjs(contrato.fecha_fin_estimada).startOf("day") ||
        dayjs(contrato.fecha_fin).startOf("day");

      // La fecha estimada aún no ha sido establecida, entonces solo considerar las asistencias desde la fecha de inicio del contrato
      asistencias = asistencias.filter((asistencia) => {
        const fechaAsistencia = dayjs(asistencia.asistencium.fecha).startOf(
          "day"
        );
        const fechaInicioContrato = dayjs(contrato.fecha_inicio).startOf("day");

        return (
          (fechaAsistencia.isSame(fechaInicioContrato, "day") ||
            fechaAsistencia.isAfter(fechaInicioContrato, "day")) &&
          (fechaAsistencia.isSame(fechaFinal, "day") ||
            fechaAsistencia.isBefore(fechaFinal, "day")) &&
          (asistencia.asistencia === "Asistio" ||
            asistencia.asistencia === "Comisión")
        );
      });

      if (contrato.tareo === "Mes cerrado") {
        const fechaFinEstimada = dayjs(contrato.fecha_inicio).add(
          contrato.periodo_trabajo,
          "month"
        );
        const diasEnPeriodo = fechaFinEstimada.diff(
          dayjs(contrato.fecha_inicio),
          "day"
        );
        const domingosEnPeriodo = contarDomingos(
          dayjs(contrato.fecha_inicio),
          fechaFinEstimada
        );

        cantidadEstimada =
          (diasEnPeriodo - domingosEnPeriodo) * contrato.periodo_trabajo;
      } else 
      if (contrato.tareo === "Lunes a sabado") {
        cantidadEstimada = 15 * contrato.periodo_trabajo;
      }
      // Llama a la función calculateEstimatedDate con los argumentos correspondientes.
      if (
        asistencias &&
        asistencias.length > 0 &&
        asistencias[asistencias.length - 1].asistencium &&
        asistencias[asistencias.length - 1].asistencium.fecha
      ) {
        let result = calculateEstimatedDate(
          dayjs(asistencias[asistencias.length - 1].asistencium.fecha),
          fechaEstimada,
          dayjs(contrato.fecha_inicio),
          asistencias,
          cantidadEstimada,
          contrato.tareo
        );
        // Actualiza la fecha estimada con el resultado.
        fechaEstimada = result.estimatedDate;
      }
      // Calcula la cantidad real basándose en las asistencias.
      cantidadReal = calcularCantidadReal(asistencias);
      await contrato.update({
        fecha_fin_estimada: fechaEstimada.toDate(),
      });

      contratosArray.push({
        contrato,
        cantidadReal,
        cantidadEstimada,
        fechaEstimada,
        trabajador,
      });
    }
    return { contratosAFinalizar: contratosArray };
  } catch (error) {
    console.error(error);
  }
};
//Para finalizar los contratos de las trabajadores individuales si se completan las asistencias
const individual = async () => {
  try {
    // Obtén todos los contratos activos
    const contratosActivos = await contrato.findAll({
      where: {
        asociacion_id: null,
        finalizado: { [Op.not]: true },
      },
      attributes: { exclude: ["contrato_id"] },
      include: [
        {
          model: trabajador_contrato,
          include: [
            {
              model: trabajador,
              attributes: { exclude: ["usuarioId"] },
              include: [
                {
                  model: trabajadorAsistencia,
                  attributes: { exclude: ["trabajadorDni", "asistenciumId"] },
                  include: [{ model: asistencia }],
                },
                { model: evaluacion },
              ],
            },
          ],
        },
      ],
    });

    const contratosArray = [];

    for (const contrato of contratosActivos) {
      let trabajadorAsistencias =
        contrato?.trabajador_contratos[0]?.trabajador?.trabajador_asistencia;

      if (!trabajadorAsistencias) continue;
      let asistencias = trabajadorAsistencias.sort(
        (a, b) => new Date(a.asistencium.fecha) - new Date(b.asistencium.fecha)
      );

      let cantidadEstimada = 0;
      let cantidadReal = 0;
      let fechaEstimada = dayjs(contrato.fecha_fin).startOf("day");
      let fechaFinal =
        dayjs(contrato.fecha_fin_estimada).startOf("day") ||
        dayjs(contrato.fecha_fin).startOf("day");

      asistencias = asistencias.filter((asistencia) => {
        const fechaAsistencia = dayjs(asistencia.asistencium.fecha).startOf(
          "day"
        );
        const fechaInicioContrato = dayjs(contrato.fecha_inicio).startOf("day");

        return (
          (fechaAsistencia.isSame(fechaInicioContrato, "day") ||
            fechaAsistencia.isAfter(fechaInicioContrato, "day")) &&
          (fechaAsistencia.isSame(fechaFinal, "day") ||
            fechaAsistencia.isBefore(fechaFinal, "day")) &&
          (asistencia.asistencia === "Asistio" ||
            asistencia.asistencia === "Comisión")
        );
      });
      if (contrato.tareo == "Mes cerrado") {
        const fechaFinEstimada = dayjs(contrato.fecha_inicio).add(
          contrato.periodo_trabajo,
          "month"
        );
        const diasEnPeriodo = fechaFinEstimada.diff(
          dayjs(contrato.fecha_inicio),
          "day"
        );
        cantidadEstimada = diasEnPeriodo;
      } else if (contrato.tareo == "Lunes a sabado") {
        cantidadEstimada = 15 * parseInt(contrato.periodo_trabajo);
      }

      if (
        asistencias &&
        asistencias.length > 0 &&
        asistencias[asistencias.length - 1].asistencium &&
        asistencias[asistencias.length - 1].asistencium.fecha
      ) {
        //    Call the calculateEstimatedDate function with the last attendance object, the current estimated date, the contract start date, and the worker attendances array.
        let result = calculateEstimatedDate(
          dayjs(asistencias[asistencias.length - 1].asistencium.fecha),
          dayjs(fechaEstimada),
          dayjs(contrato.fecha_inicio),
          asistencias,
          cantidadEstimada,
          contrato.tareo,
          contrato
        );

        fechaEstimada = result.estimatedDate;
        cantidadReal = calcularCantidadReal(asistencias);
      }

      await contrato.update({
        fecha_fin_estimada: fechaEstimada.toDate(),
      });
      contratosArray.push({
        contrato,
        cantidadReal,
        cantidadEstimada,
        fechaEstimada,
        trabajador,
      });
    }
    return { contratosAFinalizar1: contratosArray };
  } catch (error) {
    console.error(error);
  }
};
function calculateEstimatedDate(
  attendance,
  estimatedDate,
  contractStartDate,
  workerAttendances,
  totalAsistencia,
  tareo,
  contrato
) {
  let lastAttendanceDate = attendance;
  let completedWorkDays = workerAttendances.filter(
    (a) => a.asistencia === "Asistio" || a.asistencia === "Comisión"
  ).length;
  let remainingWorkDays = totalAsistencia - completedWorkDays;

  if (tareo == "Mes cerrado") {
    estimatedDate = dayjs(lastAttendanceDate).add(remainingWorkDays, "day");
  } else if (tareo === "Lunes a sabado") {
    let currentDate = dayjs(lastAttendanceDate);
    while (remainingWorkDays > 0) {
      currentDate = dayjs(currentDate).add(1, "day");
      // Exclude Sunday from the working days
      if (currentDate.day() !== 0) {
        remainingWorkDays--;
      }
    }
    estimatedDate = currentDate;
  }

  return { estimatedDate };
}

const asociacionFinalizarContratos = async (
  contrato,
  cantidadReal,
  cantidadEstimada,
  fechaEstimada,
  trabajador
) => {
  try {
    const finalizarPromises = [];
    if (cantidadReal >= cantidadEstimada) {
      finalizarPromises.push(
        contrato.update({
          finalizado: true,
          fecha_fin: fechaEstimada.toDate(),
          fecha_fin_estimada: fechaEstimada.toDate(),
        })
      );
      // Desligar trabajadores de la asociación y finalizar evaluaciones
      for (const trabajador of contrato.asociacion.trabajadors) {
        finalizarPromises.push(trabajador.update({ asociacion_id: null }));

        const evaluacionesActivas = await trabajador.getEvaluacions({
          where: { finalizado: { [Op.not]: true } },
        });

        // Ahora puedes iterar sobre evaluacionesActivas y finalizarlas
        for (const evaluacion of evaluacionesActivas) {
          finalizarPromises.push(evaluacion.update({ finalizado: true }));
        }
      }
    }
    return Promise.all(finalizarPromises);
  } catch (error) {
    console.error(error);
  }
};

const individualFinalizarContratos = async (
  contrato,
  cantidadReal,
  cantidadEstimada,
  fechaEstimada
) => {
  try {
    const finalizarPromises = [];
    if (cantidadReal >= cantidadEstimada) {
      finalizarPromises.push(
        contrato.update({
          finalizado: true,
          fecha_fin: fechaEstimada.toDate(),
          fecha_fin_estimada: fechaEstimada.toDate(),
        })
      );
      // Finalizamos la evaluacion activa del trabajador, si existe
      const trabajadorEvaluacion =
        contrato?.trabajador_contratos[0]?.trabajador?.evaluacions?.find(
          (evaluacion) => !evaluacion.finalizado
        );
      if (trabajadorEvaluacion) {
        finalizarPromises.push(
          trabajadorEvaluacion.update({
            finalizado: true,
          })
        );
      }
    }
    return Promise.all(finalizarPromises);
  } catch (error) {
    console.error(error);
  }
};
const actulizarFechaFin = async (req, res, next) => {
  try {
    const { contratosAFinalizar } = await asociacionData();
    const { contratosAFinalizar1 } = await individual();

    // Wait for the getPlanillaAprobacion to resolve
    await getPlanillaAprobacion();

    for (const {
      contrato,
      cantidadReal,
      cantidadEstimada,
      fechaEstimada,
    } of contratosAFinalizar) {
      await asociacionFinalizarContratos(
        contrato,
        cantidadReal,
        cantidadEstimada,
        fechaEstimada
      );
    }

    for (const {
      contrato,
      cantidadReal,
      cantidadEstimada,
      fechaEstimada,
    } of contratosAFinalizar1) {
      await individualFinalizarContratos(
        contrato,
        cantidadReal,
        cantidadEstimada,
        fechaEstimada
      );
    }

    return res
      .status(200)
      .json({ msg: "Asistencias validadas con éxito!.", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo validar." });
  }
};

module.exports = { actulizarFechaFin };

// asociacion.start(); // Inicia la tarea
