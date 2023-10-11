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

const crearTareoAsociacion = async () => {
  try {
    const asociaciones = await asociacion.findAll({
      include: [
        {
          model: contrato,
          attributes: [
            "id",
            "fecha_inicio",
            "fecha_fin_estimada",
            "tipo_contrato",
          ],
          include: [
            { model: teletrans },
            {
              model: aprobacion_contrato_pago,
              attributes: { exclude: ["fecha"] },
            },
            {
              model: trabajador_contrato,
              where: { estado: "Activo" },
              attributes: ["id"],
              required: true,
              include: [
                {
                  model: trabajador,
                  attributes: [
                    "dni",
                    "codigo_trabajador",
                    "apellido_paterno",
                    "apellido_materno",
                    "nombre",
                  ],
                },
                {
                  model: trabajadorAsistencia,
                  attributes: ["asistencia"],
                  include: [{ model: asistencia, attributes: ["fecha"] }],
                },
              ],
            },
          ],
        },
      ],
    });
    const usuarios = await usuario.findAll({
      where: {
        cargo_id: [15, 44],
      },
    });

    const formatData = asociaciones
      .map((asociacion) => {
        const contrato = asociacion?.contratos[0];
        if (!contrato) return [];

        let subarrayId = 1;
        const inicio = dayjs(contrato.fecha_inicio);
        const fin = dayjs(contrato.fecha_fin_estimada);
        const subarrays = [];
        let asistencias;
        let contadorAsistencias = 0;
        let subAsistencias = [];
        let fechaInicioSubarray = null;
        let fechaFinSubarray = null;
        let currentDate = inicio;
        let indexAsistencia = 0;

        // Identificar el trabajador_contrato con el trabajador de menor código
        const trabajadorContratoMenorCodigo =
          contrato?.trabajador_contratos.reduce((prev, curr) =>
            prev.trabajador.codigo_trabajador <
            curr.trabajador.codigo_trabajador
              ? prev
              : curr
          );
        // Acceder a las asistencias de ese trabajador_contrato
        asistencias = ordenarAsistencia(
          inicio,
          fin,
          trabajadorContratoMenorCodigo?.trabajador_asistencia
        );

        while (currentDate.isBefore(fin) || currentDate.isSame(fin)) {
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
              subarray_id: subarrayId,
              asociacion_id: asociacion?.id,
              nombre: asociacion?.nombre,
              fecha_inicio: dayjs(fechaInicioSubarray)?.format("DD-MM-YYYY"),
              fecha_fin: dayjs(fechaFinSubarray)?.format("DD-MM-YYYY"),
              dias_laborados: contadorAsistencias,
              volquete: contrato?.dataValues.teletrans?.at(-1)?.volquete || 0,
              teletran: contrato?.dataValues?.teletrans?.at(-1)?.teletran || 0,
              total: contrato?.dataValues?.teletrans?.at(-1)?.saldo,
              contrato_id: contrato?.dataValues?.id,
              jefe: usuarios[0].nombre,
              gerente: usuarios[1].nombre,
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
      })
      .flat();
    await guardarAprobacion(formatData);
  } catch (error) {
    console.log(error);
  }
};

const crearTareoIndividual = async () => {
  try {
    const trabajadores = await trabajador.findAll({
      where: {
        asociacion_id: { [Op.is]: null },
      },
      attributes: ["dni", "apellido_paterno", "apellido_materno", "nombre"],
      include: [
        {
          model: trabajador_contrato,
          where: { estado: "Activo" },
          attributes: ["id"],
          required: true,
          include: [
            {
              model: contrato,
              attributes: [
                "id",
                "fecha_inicio",
                "fecha_fin_estimada",
                "tipo_contrato",
                "tareo",
              ],
              include: [
                { model: teletrans },
                {
                  model: aprobacion_contrato_pago,
                  attributes: ["subarray_id"],
                },
              ],
            },
          ],
        },
        {
          model: trabajadorAsistencia,
          attributes: ["asistencia"],
          include: [{ model: asistencia, attributes: ["fecha"] }],
        },
      ],
    });

    const usuarios = await usuario.findAll({
      where: {
        cargo_id: [15, 44],
      },
    });

    const aprobacionFilter = []; // Array para almacenar los datos filtrados
    let subarrayId = 1; // ID del subarray actual
    const subarrayIdsPorTrabajador = {}; // Objeto para almacenar el ID del subarray por trabajador

    trabajadores.forEach((trabajador) => {
      const contrato = trabajador?.trabajador_contratos[0]?.contrato;
      if (!contrato) {
        return;
      }

      const fechaInicioContrato = dayjs(contrato?.fecha_inicio).startOf("day");
      const fechaInicioData = dayjs(contrato?.fecha_inicio).startOf("day");
      const fechaFinData = dayjs(contrato?.fecha_fin_estimada).startOf("day");
      const asistencias = ordenarAsistencia(
        fechaInicioData,
        fechaFinData,
        trabajador?.trabajador_asistencia
      );

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
            asistencia.asistencia === "Comisión" ||
            asistencia.asistencia === "Permiso remunerado" ||
            asistencia.asistencia === "Vacaciones" ||
            asistencia.asistencia === "Descanso medico" ||
            asistencia.asistencia === "Dia Libre"
          ) {
            contador++; // Incrementar el contador de asistencias
            subAsistencias.push(asistencia); // Agregar la asistencia al subarray
            if (contador === 1) {
              fechaInicio = asistencia.asistencium.fecha; // Establecer la fecha de inicio del subarray
            }
            if (
              contrato.tareo === "Lunes a sabado" ||
              contrato.tareo === "Lunes a domingo" ||
              contrato.tareo === "20 días"
            ) {
              let limitDays = 15;
              if (contrato.tareo === "20 días") {
                limitDays = 20;
              }
              if (contador === limitDays) {
                fechaFin = asistencia.asistencium.fecha; // Establecer la fecha de fin del subarray
                if (!subarrayIdsPorTrabajador.hasOwnProperty(trabajador.dni)) {
                  subarrayIdsPorTrabajador[trabajador.dni] = 1; // Inicializar el ID del subarray para el trabajador actual
                } else {
                  subarrayIdsPorTrabajador[trabajador.dni]++; // Incrementar el ID del subarray para el trabajador actual
                }

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
              if (contador === 1) {
                fechaInicio = asistencia.asistencium.fecha;
              }

              if (contador == splitDay) {
                fechaFin = asistencia.asistencium.fecha;
                if (!subarrayIdsPorTrabajador.hasOwnProperty(trabajador.dni)) {
                  subarrayIdsPorTrabajador[trabajador.dni] = 1;
                } else {
                  subarrayIdsPorTrabajador[trabajador.dni]++;
                }

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
                  if (subarrayCount === 1) {
                    // Si acabamos de completar el primer subarray, entonces necesitamos calcular el splitDay para el segundo subarray del mismo mes
                    splitDay = dayjs(fechaInicio).daysInMonth() - splitDay;
                    fechaInicio = fechaAsistencia
                      .add(1, "day")
                      .format("YYYY-MM-DD");
                  }
                }
                contador = 0;
              }

              currentDate = currentDate.add(1, "day");
            }
          }
        }
      }
    });
    await guardarAprobacion(aprobacionFilter);
  } catch (error) {
    console.log(error);
  }
};
async function guardarAprobacion(aprobaciones) {
  const subarrayIds = aprobaciones.map((a) => a.subarray_id);
  const contratoIds = aprobaciones.map((a) => a.contrato_id);

  // Buscando registros existentes
  const existingRecords = await aprobacion_contrato_pago.findAll({
    where: {
      subarray_id: { [Op.in]: subarrayIds },
      contrato_id: { [Op.in]: contratoIds },
    },
  });
  // Creando un conjunto con registros existentes para rápido acceso
  const existingSet = new Set();
  existingRecords.forEach((record) => {
    existingSet.add(
      `${record.subarray_id.toString()}-${record.contrato_id.toString()}`
    );
  });
  // Filtrando aprobaciones no existentes
  const aprobacionesNoExistentes = aprobaciones.filter((aprobacion) => {
    const key = `${aprobacion.subarray_id.toString()}-${aprobacion.contrato_id.toString()}`;
    return !existingSet.has(key);
  });
  // Si existen aprobaciones no existentes, entonces insertamos en masa
  if (aprobacionesNoExistentes.length > 0) {
    await aprobacion_contrato_pago.bulkCreate(aprobacionesNoExistentes);
  }
}

const ordenarAsistencia = (inicio, fin, asistencias) => {
  return asistencias
    .filter((asistencia) => {
      const asistenciaFecha = dayjs(asistencia?.asistencium?.fecha);
      return (
        (asistenciaFecha.isSame(inicio) || asistenciaFecha.isAfter(inicio)) &&
        (asistenciaFecha.isSame(fin) || asistenciaFecha.isBefore(fin)) &&
        [
          "Asistio",
          "Comisión",
          "Permiso remunerado",
          "Vacaciones",
          "Descanso medico",
          "Dia Libre",
        ].includes(asistencia.asistencia)
      );
    })
    .sort(
      (a, b) => new Date(a.asistencium.fecha) - new Date(b.asistencium.fecha)
    );
};

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
  const teletrans = trabajador.trabajador_contratos[0].contrato?.teletrans[0];
  const contrato = trabajador.trabajador_contratos[0].contrato;

  aprobacionFilter.push({
    subarray_id: subarrayIdsPorTrabajador[trabajador.dni],
    nombre:
      trabajador.apellido_paterno +
      " " +
      trabajador.apellido_materno +
      " " +
      trabajador.nombre,
    fecha_inicio: dayjs(fechaInicio).format("DD-MM-YYYY"),
    fecha_fin: dayjs(fechaFin).format("DD-MM-YYYY"),
    volquete: teletrans?.volquete,
    teletran: teletrans?.teletrans,
    dias_laborados: contador,
    contrato_id: contrato?.id,
    dni: trabajador.dni,
    jefe: usuarios[0].nombre,
    gerente: usuarios[1].nombre,
  });
}

//Para finalizar los contratos de las asocaciones si se completan las asistencias
const asociacionData = async () => {
  try {
    const asociaciones = await asociacion.findAll({
      include: [
        {
          model: contrato,
          attributes: [
            "id",
            "fecha_inicio",
            "fecha_fin",
            "fecha_fin_estimada",
            "tipo_contrato",
            "tareo",
            "periodo_trabajo",
            "finalizado",
          ],
          include: [
            { model: teletrans },
            {
              model: aprobacion_contrato_pago,
              attributes: { exclude: ["fecha"] },
            },
            {
              model: trabajador_contrato,
              where: { estado: "Activo" },
              attributes: ["id", "estado"],
              required: true,
              include: [
                {
                  model: trabajador,
                  attributes: [
                    "dni",
                    "codigo_trabajador",
                    "apellido_paterno",
                    "apellido_materno",
                    "nombre",
                  ],
                },
                {
                  model: trabajadorAsistencia,
                  attributes: ["asistencia"],
                  include: [{ model: asistencia, attributes: ["fecha"] }],
                },
                { model: evaluacion, attributes: ["id", "finalizado"] },
              ],
            },
          ],
        },
      ],
    });

    const filterAsociacion = asociaciones.filter(
      (item) => item.contratos.length > 0
    );

    const contratosArray = [];
    for (const contrato of filterAsociacion) {
      const trabajadores = contrato?.contratos[0]?.trabajador_contratos;
      let trabajadorMenorCodigo = trabajadores?.sort((a, b) =>
        a.trabajador.codigo_trabajador.localeCompare(
          b.trabajador.codigo_trabajador
        )
      )[0];

      if (trabajadorMenorCodigo.trabajador_asistencia?.length === 0) {
        continue;
      }
      let cantidadEstimada = 0;
      let fechaEstimada = dayjs(contrato?.contratos[0]?.fecha_fin);
      const inicio = dayjs(contrato?.contratos[0]?.fecha_inicio);
      const fin = dayjs(contrato?.contratos[0]?.fecha_fin_estimada);

      const asistencias = ordenarAsistencia(
        inicio,
        fin,
        trabajadorMenorCodigo.trabajador_asistencia
      );
      let daysAlreadyWorked = asistencias.length;

      if (
        contrato?.contratos[0]?.tareo === "Lunes a sabado" ||
        contrato?.contratos[0]?.tareo === "Lunes a domingo"
      ) {
        cantidadEstimada =
          15 * parseInt(contrato?.contratos[0]?.periodo_trabajo);
      } else if (contrato?.contratos[0]?.tareo === "20 días") {
        cantidadEstimada =
          20 * parseInt(contrato?.contratos[0]?.periodo_trabajo);
      }

      let remainingWorkDays =
        parseInt(cantidadEstimada) - parseInt(daysAlreadyWorked);

      if (
        asistencias &&
        asistencias.length > 0 &&
        asistencias[asistencias.length - 1].asistencium &&
        asistencias[asistencias.length - 1].asistencium.fecha
      ) {
        let result = calculateEstimatedDate(
          dayjs(asistencias[asistencias.length - 1].asistencium.fecha),
          remainingWorkDays,
          contrato?.contratos[0]?.tareo,
          asistencias
        );
        fechaEstimada = result.estimatedDate;
      }
      await contrato.update({
        fecha_fin_estimada: fechaEstimada,
      });

      contratosArray.push({
        contrato,
        daysAlreadyWorked,
        cantidadEstimada,
        fechaEstimada,
      });
    }
    return { contratosAFinalizar: contratosArray };
  } catch (error) {
    console.error(error);
  }
};
// //Para finalizar los contratos de las trabajadores individuales si se completan las asistencias
const individual = async () => {
  try {
    // Obtén todos los contratos activos
    const contratosActivos = await contrato.findAll({
      where: {
        asociacion_id: null,
      },
      attributes: [
        "id",
        "fecha_inicio",
        "fecha_fin",
        "fecha_fin_estimada",
        "tareo",
        "periodo_trabajo",
        "finalizado",
      ],
      include: [
        {
          model: trabajador_contrato,
          where: { estado: "Activo" },
          include: [
            {
              model: trabajador,
              attributes: [
                "dni",
                "nombre",
                "apellido_paterno",
                "apellido_materno",
                "asociacion_id",
              ],
            },
            {
              model: trabajadorAsistencia,
              attributes: ["asistencia"],
              include: [{ model: asistencia, attributes: ["fecha"] }],
            },
            {
              model: evaluacion,
              attributes: ["id", "finalizado"],
            },
          ],
        },
      ],
    });

    const contratosArray = [];
    for (const contrato of contratosActivos) {
      const trabajadorAsistencias =
        contrato.trabajador_contratos[0].trabajador_asistencia;
      if (contrato.tareo === "Mes cerrado") continue;
      if (!trabajadorAsistencias) continue;

      let cantidadEstimada = 0;
      const inicio = dayjs(contrato.fecha_inicio);
      const fin = dayjs(contrato.fecha_fin_estimada);
      const asistencias = ordenarAsistencia(inicio, fin, trabajadorAsistencias);
      let daysAlreadyWorked = asistencias.length;
      if (
        contrato.tareo === "Lunes a sabado" ||
        contrato.tareo === "Lunes a domingo"
      ) {
        cantidadEstimada = 15 * parseInt(contrato.periodo_trabajo);
      } else if (contrato.tareo === "20 días") {
        cantidadEstimada = 20 * parseInt(contrato.periodo_trabajo);
      }
      let remainingWorkDays =
        parseInt(cantidadEstimada) - parseInt(daysAlreadyWorked);

      if (
        asistencias &&
        asistencias.length > 0 &&
        asistencias[asistencias.length - 1].asistencium &&
        asistencias[asistencias.length - 1].asistencium.fecha
      ) {
        //    Call the calculateEstimatedDate function with the last attendance object, the current estimated date, the contract start date, and the worker attendances array.
        let result = calculateEstimatedDate(
          dayjs(asistencias[asistencias.length - 1].asistencium.fecha),
          remainingWorkDays,
          contrato.tareo,
          asistencias
        );

        fechaEstimada = result.estimatedDate;
      }
      await contrato.update({
        fecha_fin_estimada: fechaEstimada.toDate(),
      });
      contratosArray.push({
        contrato,
        daysAlreadyWorked,
        cantidadEstimada,
        fechaEstimada,
      });
    }
    return { contratosAFinalizar1: contratosArray };
  } catch (error) {
    console.error(error);
  }
};
function calculateEstimatedDate(
  attendance,
  totalAsistencia,
  tareo,
  asistencias
) {
  let lastAttendanceDate = attendance;
  let remainingWorkDays = totalAsistencia; // esto debería ser el total menos los días ya trabajados
  let estimatedDate;

  switch (tareo) {
    case "Lunes a sabado":
    case "20 días":
      let domingosTrabajados = asistencias.filter(
        (a) => dayjs(a.asistencium.fecha).day() === 0
      ).length;

      // Reducir los días laborables restantes por los domingos trabajados
      remainingWorkDays -= domingosTrabajados;

      // Tomamos la última fecha de asistencia como punto de partida
      let currentDate = dayjs(
        asistencias[asistencias.length - 1].asistencium.fecha
      );

      while (remainingWorkDays > 0) {
        currentDate = dayjs(currentDate).add(1, "day");
        if (currentDate.day() !== 0) {
          // Excluimos el domingo de los días laborables
          remainingWorkDays--;
        }
      }

      // Ajustes finales para la fecha estimada, teniendo en cuenta los domingos trabajados
      if (currentDate.day() === 0) {
        if (domingosTrabajados > 0) {
          currentDate = dayjs(currentDate).subtract(1, "day"); // Mover al sábado anterior
          domingosTrabajados--; // Restar uno al contador de domingos trabajados
        } else {
          currentDate = dayjs(currentDate).add(1, "day"); // Mover al lunes siguiente
        }
      }

      estimatedDate = currentDate;
      break;

    case "Lunes a domingo":
      estimatedDate = dayjs(lastAttendanceDate).add(remainingWorkDays, "day");
      break;
  }

  return { estimatedDate };
}

const asociacionFinalizarContratos = async (
  contrato,
  cantidadReal,
  cantidadEstimada,
  fechaEstimada
) => {
  try {
    const contratos = contrato?.contratos[0];
    const trabajadores = contrato?.contratos[0]?.trabajador_contratos?.map(
      (item) => item?.trabajador
    );
    const evaluaciones = contrato?.contratos[0]?.trabajador_contratos?.map(
      (item) => item?.evaluacion
    );
    const trabajadorContratos = contrato?.contratos[0]?.trabajador_contratos;
    const finalizarPromises = [];

    if (cantidadReal >= cantidadEstimada) {
      finalizarPromises.push(
        contratos.update({
          finalizado: true,
          fecha_fin: fechaEstimada.toDate(),
          fecha_fin_estimada: fechaEstimada.toDate(),
        })
      );
      // Desligar trabajadores de la asociación y finalizar evaluaciones
      for (const trabajador of trabajadores) {
        finalizarPromises.push(trabajador.update({ asociacion_id: null }));

        // Ahora puedes iterar sobre evaluacionesActivas y finalizarlas
        for (const evaluacion of evaluaciones) {
          finalizarPromises.push(evaluacion.update({ finalizado: true }));
        }
        for (const trabajadorContrato of trabajadorContratos) {
          finalizarPromises.push(
            trabajadorContrato.update({ estado: "Finalizado" })
          );
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
    const trabajadorContrato = contrato.trabajador_contratos[0];
    const finalizarPromises = [];
    const fechaActual = dayjs().format("YYYY-MM-DD");

    // Comprobamos si el tareo es "Mes cerrado" y si la fecha_fin coincide con la fecha actual
    if (
      contrato.tareo === "Mes cerrado" &&
      contrato.fecha_fin === fechaActual
    ) {
      finalizarPromises.push(
        trabajadorContrato.update({
          estado: "Finalizado",
        })
      );
    }
    if (cantidadReal >= cantidadEstimada) {
      finalizarPromises.push(
        contrato.update({
          fecha_fin: fechaEstimada.toDate(),
        })
      );
      finalizarPromises.push(
        trabajadorContrato.update({
          estado: "Finalizado",
        })
      );
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

    crearTareoIndividual();
    crearTareoAsociacion();

    for (const {
      contrato,
      daysAlreadyWorked,
      cantidadEstimada,
      fechaEstimada,
    } of contratosAFinalizar) {
      await asociacionFinalizarContratos(
        contrato,
        daysAlreadyWorked,
        cantidadEstimada,
        fechaEstimada
      );
    }
    for (const {
      contrato,
      daysAlreadyWorked,
      cantidadEstimada,
      fechaEstimada,
    } of contratosAFinalizar1) {
      await individualFinalizarContratos(
        contrato,
        daysAlreadyWorked,
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
