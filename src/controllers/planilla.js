const {
  trabajador,
  asociacion,
  contrato,
  evaluacion,
  campamento,
  teletrans,
  asistencia,
  trabajadorAsistencia,
  pago,
  contrato_pago,
  pago_asociacion,
  trabajador_contrato,
  aprobacion_contrato_pago,
  area,
  cargo,
  gerencia,
  sequelize,
} = require("../../config/db");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

//lista de trabajadores y planillas para la vista de planillas
const getPlanilla = async (req, res, next) => {
  try {
    const trabajadores = trabajador_contrato.findAll({
      where: { estado: "Activo" },
      attributes: ["id"],
      include: [
        {
          model: contrato,
          attributes: [
            "fecha_inicio",
            "fecha_fin",
            "fecha_fin_estimada",
            "periodo_trabajo",
          ],
          include: [
            {
              model: teletrans,
              attributes: ["volquete", "total", "saldo", "teletrans"],
            },
            {
              model: campamento,
              attributes: ["nombre"],
            },
            { model: gerencia, attributes: ["nombre"] },
            { model: area, attributes: ["nombre"] },
            {
              model: cargo,
              attributes: ["nombre"],
            },
          ],
        },
        {
          model: trabajador,
          where: {
            asociacion_id: { [Op.is]: null },
            deshabilitado: { [Op.not]: true },
          },
          attributes: [
            "nombre",
            "apellido_paterno",
            "apellido_materno",
            "dni",
            "fecha_nacimiento",
            "telefono",
          ],
        },
        {
          model: trabajadorAsistencia,
          attributes: ["asistencia"],
          include: [
            {
              model: asistencia,
              attributes: ["fecha"],
            },
          ],
        },
        {
          model: evaluacion,
          attributes: [
            "condicion_cooperativa",
            "recomendado_por",
            "cooperativa",
          ],
        },
      ],
    });

    const getasoci = asociacion.findAll({
      include: [
        {
          model: contrato,
          attributes: [
            "fecha_inicio",
            "fecha_fin",
            "fecha_fin_estimada",
            "finalizado",
            "periodo_trabajo",
          ],
          required: true,
          include: [
            { model: teletrans },
            {
              model: campamento,
              attributes: ["nombre"],
            },
            { model: gerencia, attributes: ["nombre"] },
            { model: area, attributes: ["nombre"] },
            {
              model: cargo,
              attributes: ["nombre"],
            },
            {
              model: trabajador_contrato,
              where: { estado: "Activo" },
              attributes: ["estado"],
              include: [
                {
                  model: trabajador,
                  attributes: [
                    "nombre",
                    "apellido_paterno",
                    "apellido_materno",
                    "dni",
                    "fecha_nacimiento",
                    "telefono",
                    "codigo_trabajador",
                  ],
                },
                {
                  model: trabajadorAsistencia,
                  attributes: ["asistencia"],
                  include: [
                    {
                      model: asistencia,
                      attributes: ["fecha"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const [traba, asoci] = await Promise.all([trabajadores, getasoci]);

    const mapAsociacion = asoci?.map((item, i) => {
      const contrato = item?.contratos[0];
      const fechaInicioContrato = dayjs(contrato?.fecha_inicio);
      const fechaFinContrato = dayjs(contrato?.fecha_fin_estimada);

      const sortedTrabajadores = contrato?.trabajador_contratos
        ?.sort((a, b) => {
          const codigoA = parseInt(a.trabajador.codigo_trabajador.slice(-5));
          const codigoB = parseInt(b.trabajador.codigo_trabajador.slice(-5));
          return codigoA - codigoB;
        })
        .slice(0, 1);
      
      const asistencia = sortedTrabajadores[0]?.trabajador_asistencia?.filter(
        (data) => {
          return (
            data.asistencia === "Asistio" || data.asistencia === "Comisión"
          );
        }
      ).length;

      return {
        nombre: item?.nombre,
        asociacion_id: item?.id,
        codigo: item?.codigo,
        fecha_inicio: fechaInicioContrato.format("DD-MM-YYYY"),
        fecha_fin: fechaFinContrato.format("DD-MM-YYYY"),
        contratos: contrato,
        volquete: contrato?.teletrans[0]?.volquete,
        puesto: "",
        campamento: contrato?.campamento?.nombre.toString(),
        teletran: contrato?.teletrans[0]?.teletrans,
        total: contrato?.teletrans[0]?.total,
        saldo: contrato?.teletrans[0]?.saldo,
        asistencia: asistencia,
        area: contrato?.area?.nombre,
        periodo_trabajo: contrato?.periodo_trabajo,
        puesto: item?.tipo,
      };
    });

    // trabajador

    const formatTrabajador = traba.map((item) => {
      const contrato = item?.contrato;
      const trabajador = item?.trabajador;
      const evaluacion = item?.evaluacion;
      const fechaInicio = dayjs(contrato?.fecha_inicio);
      const fechaFin = dayjs(contrato?.fecha_fin_estimada);
      const asistencia = item?.trabajador_asistencia?.filter((data) => {
        const fechaAsistencia = dayjs(data.asistencium.fecha).startOf("day");
        return (
          (fechaAsistencia.isSame(fechaInicio) ||
            fechaAsistencia.isAfter(fechaInicio)) &&
          (fechaAsistencia.isSame(fechaFin) ||
            fechaAsistencia.isBefore(fechaFin)) &&
          (data.asistencia === "Asistio" || data.asistencia === "Comisión")
        );
      }).length;
      console.log(item.evaluacion);
      return {
        dni: trabajador?.dni,
        nombre:
          trabajador?.apellido_paterno +
          " " +
          trabajador?.apellido_materno +
          " " +
          trabajador?.nombre,
        fecha_nacimiento: trabajador?.fecha_nacimiento,
        telefono: trabajador?.telefono,
        contratos: contrato,
        gerencia: contrato?.gerencium?.nombre,
        area: contrato?.area?.nombre,
        puesto: contrato?.cargo?.nombre,
        periodo_trabajo: contrato?.periodo_trabajo,
        fecha_inicio: fechaInicio.format("DD-MM-YYYY"),
        fecha_fin: fechaFin.format("DD-MM-YYYY"),
        campamento: contrato?.campamento?.nombre,
        asistencia: asistencia,
        evaluacion: evaluacion,
        volquete: contrato?.teletrans[0]?.volquete || 0,
        teletran: contrato?.teletrans[0]?.teletrans || 0,
        total: contrato?.teletrans[0]?.total || 0,
        saldo: contrato?.teletrans[0]?.saldo || 0,
      };
    });

    const final = mapAsociacion.concat(formatTrabajador);
    const finalConId = final.map((elemento, indice) => {
      return {
        id: indice + 1,
        ...elemento,
      };
    });

    return res.status(200).json({ data: finalConId });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getPlanillaHistoriaTrabajador = async (req, res, next) => {
  let id = req.params.id;
  try {
    const traba = await trabajador.findOne({
      where: {
        dni: id,
        asociacion_id: { [Op.is]: null },
        deshabilitado: { [Op.not]: true },
      },
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajadorAsistencia,
          attributes: {
            exclude: ["trabajadorId", "asistenciumId", "trabajadorDni"],
          },
          include: [{ model: asistencia }],
        },
        {
          model: trabajador_contrato,
          attributes: { exclude: ["contrato_id"] },
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
              where: { finalizado: { [Op.not]: true } },
              include: [{ model: teletrans }],
            },
          ],
        },
      ],
    });

    // Filtramos las asistencias para solo obtener las que tienen asistencia: "Asistio"
    const asistencias = traba?.trabajador_asistencia?.filter(
      (asistencia) => asistencia.asistencia === "Asistio"
    );

    // Separamos las asistencias en sub-arrays de máximo 15 elementos
    const asistenciasDivididas = [];
    let asistenciasValidas = 0;
    let asistenciasActuales = [];

    for (let i = 0; i < asistencias?.length; i++) {
      if (asistencias[i].asistencia === "Asistio") {
        asistenciasValidas++;
        asistenciasActuales.push(asistencias[i]);
      }

      if (asistenciasValidas === 15 || i === asistencias.length - 1) {
        asistenciasDivididas.push(asistenciasActuales);
        asistenciasValidas = 0;
        asistenciasActuales = [];
      }
    }

    // Construimos los objetos finales por cada bloque de 15 asistencias
    const trabaFinal = asistenciasDivididas.map((asistenciasBloque) => {
      const trabajadorData = { ...traba.dataValues };
      delete trabajadorData.trabajador_asistencias;

      return {
        ...trabajadorData,
        trabajador_asistencias: asistenciasBloque.sort(
          (a, b) =>
            new Date(a.asistencium.fecha) - new Date(b.asistencium.fecha)
        ),
      };
    });

    return res.status(200).json({ data: asoci });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

//lista de asociaciones con trabajadores para la tabla asocicion para prograrmar
const getListaPago = async (req, res, next) => {
  try {
    const allAsociaciones = await asociacion.findAll();
    const allAprobaciones = await aprobacion_contrato_pago.findAll({
      where: { dni: { [Op.is]: null }, estado: true },
      include: [
        {
          model: contrato,
          attributes: { exclude: ["contrato_id"] },

          include: [
            {
              model: trabajador_contrato, // Aquí incluyes el modelo trabajador_contrato
              include: [
                {
                  model: trabajador,
                  attributes: { exclude: ["usuarioId"] },
                },
              ],
            },
            { model: teletrans },
            {
              model: contrato_pago,
              include: [
                { model: pago },
                {
                  model: pago_asociacion,
                  include: [
                    {
                      model: trabajador,
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

    const formatData = allAprobaciones
      ?.map((item, i) => {
        const trabajadoresProgramados = item?.contrato?.contrato_pagos
          ?.filter((data) => data.quincena === item.subarray_id)
          .map((data) => {
            const resultado = [];
            data.pago_asociacions.forEach((pago) => {
              const { trabajador_dni, teletrans } = pago;

              // Verificar si ya existe un objeto con el mismo trabajador_dni y quincena en el resultado
              const objetoExistente = resultado.find(
                (item) =>
                  item.trabajador_dni === trabajador_dni &&
                  item.quincena === data.quincena
              );

              const teletransNumber = parseFloat(teletrans); // Convertir a número

              if (objetoExistente) {
                // Si ya existe, se suma el teletrans al objeto existente
                objetoExistente.teletrans += teletransNumber;
              } else {
                // Si no existe, se agrega un nuevo objeto al resultado
                resultado.push({
                  trabajador_dni,
                  quincena: data.quincena,
                  teletrans: teletransNumber,
                });
              }
            });

            return resultado;
          })
          .flat();

        const totalVolquetes = item?.contrato?.contrato_pagos
          ?.filter((data) => data.quincena === item.subarray_id)
          .reduce((accumulator, current) => {
            return accumulator + parseInt(current.volquetes);
          }, 0);

        const pagos = {
          trabajadores: item?.contrato?.trabajador_contratos
            .map((trabajador, i) => {
              const trabajadorProgramado = trabajadoresProgramados.reduce(
                (acc, item) => {
                  if (item.trabajador_dni === trabajador.trabajador.dni) {
                    acc += item.teletrans;
                  }
                  return acc;
                },
                0
              );

              return {
                id: i + 1,
                teletrans: trabajadorProgramado,
                dni: trabajador.trabajador.dni,
                nombre: `${trabajador.trabajador.apellido_paterno} ${trabajador.trabajador.apellido_materno} ${trabajador.trabajador.nombre}`,
                telefono: trabajador.trabajador.telefono,
                cargo: item.tipo,
                programado: trabajadorProgramado > 0,
                contrato_id: item?.contratos?.at(-1)?.id,
              };
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        };

        const saldoFinal =
          parseFloat(item?.contrato?.teletrans?.at(-1)?.saldo) -
          parseFloat(totalVolquetes * 4);
        const asociacion = allAsociaciones.find(
          (ele) => ele.id == item.asociacion_id
        );
        if (saldoFinal < 1) {
          updateEstadoAprobacionContratoPago(item.id);
        }
        if (saldoFinal > 0) {
          return {
            id: i + 1,
            dni: "---",
            nombre: asociacion.nombre + " - " + item.subarray_id,
            tipo: asociacion.tipo,
            asociacion_id: asociacion.id,
            contrato_id: item?.contrato?.id,
            aprobacion: {
              id: item.id,
              firma_jefe: item.firma_jefe,
              firma_gerente: item.firma_gerente,
              huella: item.huella,
              estado: item.estado,
              fecha_inicio: item.fecha_inicio,
              subarray_id: item.subarray_id,
              pagado: item.pagado,
              fecha_fin: item.fecha_fin,
              nombre: item.nombre,
              dias_laborados: item.dias_laborados,
              volquete: item.volquete,
              teletran: item.teletran,
              asociacion_id: item.asociacion_id,
              dni: item.dni,
              observaciones: item.observaciones,
            },
            saldo: item?.contrato?.teletrans?.at(-1)?.saldo,
            total_modificado: saldoFinal,
            total: item?.contrato?.teletrans?.at(-1)?.total,
            volquete: item?.contrato?.teletrans?.at(-1)?.volquete,
            teletran: item?.contrato?.teletrans?.at(-1)?.teletrans,
            fecha_inicio: item.fecha_inicio,
            fecha_fin: item.fecha_fin,
            pagos: pagos,
            quincena: item.subarray_id,
            estado: item.estado,
            totalVolquetes: totalVolquetes,
          };
        }
      })
      .filter((item) => item?.aprobacion?.estado);

    return res.status(200).json({ data: formatData });
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

//lista de asociaciones para pago programado
const getListaAsociacionProgramada = async (req, res, next) => {
  try {
    const getAsociacion = await pago.findAll({
      where: { tipo: "asociacion" },
      include: [
        {
          model: contrato_pago,
          attributes: { exclude: ["contrato_pago_id"] },
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
              include: [{ model: asociacion }],
            },

            {
              model: pago_asociacion,
              include: [
                { model: trabajador, attributes: { exclude: ["usuarioId"] } },
              ],
            },
          ],
        },
      ],
    });

    const formatData = getAsociacion
      .map((item) => {
        return {
          id: item?.id,
          teletrans: item?.teletrans,
          observacion: item?.observacion,
          fecha_pago: item?.fecha_pago,
          estado: item?.estado,
          tipo: item?.tipo,
          volquetes: item?.volquetes,
          asociacion: item?.contrato_pagos.at(-1)?.contrato?.asociacion?.nombre,
          tipo_asociacion:
            item?.contrato_pagos.at(-1)?.contrato?.asociacion?.tipo,
          contrato_id: item?.contrato_pagos.at(-1)?.contrato?.id,
          trabajadores: item?.contrato_pagos
            ?.map((data) =>
              data?.pago_asociacions?.map((dat) => {
                return {
                  id: dat?.id,
                  teletrans: dat?.teletrans,
                  dni: dat?.trabajador_dni,
                  nombre:
                    dat?.trabajador?.nombre +
                    " " +
                    dat?.trabajador?.apellido_paterno +
                    " " +
                    dat?.trabajador?.apellido_materno,
                };
              })
            )
            .flat(),
        };
      })
      .filter(
        (item) => item?.estado === "programado" && item.trabajadores.length > 0
      );

    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

//para obtener los trabajadores aprobados par aprogramar en programacion de pagos
const getPlanillaPago = async (req, res, next) => {
  try {
    const getPlanilla = await trabajador.findAll({
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
                finalizado: { [Op.not]: true },
              },
              include: [
                { model: teletrans },
                {
                  model: contrato_pago,
                  attributes: { exclude: ["contrato_pago_id"] },
                  include: [{ model: pago }],
                },
                { model: aprobacion_contrato_pago },
                { model: cargo, attributes: { exclude: ["cargo_id"] } },
              ],
            },
          ],
        },
      ],
    });

    const filterContrato = getPlanilla.filter(
      (item) => item.trabajador_contratos.length > 0
    );

    const filterAsistencia = filterContrato?.map((item, i) => {
      const contratoActivo = item?.trabajador_contratos?.filter(
        (data) => data.contrato.finalizado === false
      );
      return {
        dni: item?.dni,
        codigo_trabajador: item?.codigo_trabajador,
        fecha_nacimiento: item?.fecha_nacimiento,
        telefono: item?.telefono,
        nombre:
          item?.apellido_paterno +
          " " +
          item?.apellido_materno +
          " " +
          item?.nombre,
        cargo: contratoActivo
          ?.map((data) => data?.contrato?.cargo?.nombre)
          .toString(),
        fecha_inicio: dayjs(
          contratoActivo?.map((data) => data?.contrato?.fecha_inicio).toString()
        ).format("DD-MM-YYYY"),
        fecha_fin: dayjs(
          contratoActivo?.map((data) => data?.contrato?.fecha_fin).toString()
        ).format("DD-MM-YYYY"),
        volquetes: contratoActivo
          ?.map((data) => data?.contrato?.teletrans.at(-1).volquete)
          .toString(),
        teletrans: contratoActivo
          ?.map((data) => data?.contrato?.teletrans.at(-1).teletrans)
          .toString(),
        total: contratoActivo
          ?.map((data) => data?.contrato?.teletrans.at(-1).total)
          .toString(),
        saldo: contratoActivo
          ?.map((data) => data?.contrato?.teletrans.at(-1).saldo)
          .toString(),
        contrato_pago: contratoActivo?.map((data) => data?.contrato_pagos),
        aprobacion: contratoActivo
          ?.map((data) => data?.aprobacion_contrato_pagos)
          ?.filter((data) => data?.estado === true && data?.pagado === null),
        contrato: item?.trabajador_contratos,
      };
    });

    return res.status(200).json({ data: filterAsistencia });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const campamentoPlanilla = async (req, res, next) => {
  try {
    const trabajadoresCapamento = await campamento.findAll({});

    return res.status(200).json({ data: trabajadoresCapamento });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getTareoTrabajador = async (req, res, next) => {
  let id = req.params.id;

  try {
    const trabajadores = await trabajador.findAll({
      where: {
        dni: id,
      },
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajador_contrato,
          attributes: { exclude: ["contrato_id"] },
          where: { estado: "Activo" },
          include: [
            {
              model: contrato,
              attributes: { exclude: ["contrato_id"] },
              include: [
                { model: teletrans },
                { model: aprobacion_contrato_pago },
              ],
            },
            {
              model: trabajadorAsistencia,
              attributes: ["asistencia"],
              include: [
                {
                  model: asistencia,
                  attributes: ["fecha"],
                  order: [["fecha", "ASC"]],
                },
              ],
            },
          ],
        },
      ],
    });

    const filterContrato = trabajadores?.filter(
      (trabajador) => trabajador?.trabajador_contratos?.length > 0
    );
    const aprobacionFilter = [];
    let subarrayId = 1;

    const createSubarray = (
      trabajador,
      subAsistencias,
      fechaInicio,
      fechaFin,
      contador
    ) => {
      const fechaInicioDayjs = dayjs(fechaInicio);
      const fechaFinDayjs = dayjs(fechaFin);
      let asistenciasValidas = 0;

      const asistenciasEnRango =
        trabajador?.trabajador_contratos[0]?.trabajador_asistencia?.filter(
          (asistencia) => {
            const fechaAsistencia = dayjs(asistencia.asistencium.fecha);

            return (
              (fechaAsistencia.isSame(fechaInicioDayjs) ||
                fechaAsistencia.isAfter(fechaInicioDayjs)) &&
              (fechaAsistencia.isSame(fechaFinDayjs) ||
                fechaAsistencia.isBefore(fechaFinDayjs))
            );
          }
        );

      asistenciasEnRango.forEach((asistencia) => {
        if (["Asistio", "Comisión", "Dia Libre"].includes(asistencia.asistencia)) {
          asistenciasValidas++;
        }
      });

      subAsistencias.sort((a, b) => {
        return a.asistencium.fecha.localeCompare(b.asistencium.fecha);
      });

      const contrato = trabajador.trabajador_contratos[0].contrato;
      const teletrans = { ...contrato?.teletrans?.slice(-1)[0] };

      const asistenciaCompleta = subAsistencias.map((item, a) => {
        return {
          id: a + 1,
          asistencia: item?.asistencia,
          fecha: item?.asistencium?.fecha,
          hora_ingreso: item?.asistencium?.hora_ingreso,
          tarde: item?.tarde,
          observacion: item?.observacion,
        };
      });

      const aprobacionFiltered =
        contrato.aprobacion_contrato_pagos?.find(
          (item) => item.subarray_id == subarrayId
        ) || {};

      aprobacionFilter.push({
        subarray_id: subarrayId,
        nombre: `${trabajador?.apellido_paterno} ${trabajador?.apellido_materno} ${trabajador?.nombre}`,
        celular: trabajador?.telefono,
        dni: trabajador?.dni,
        fecha_inicio: dayjs(fechaInicio)?.format("DD-MM-YYYY"),
        fecha_fin: dayjs(fechaFin)?.format("DD-MM-YYYY"),
        volquete: teletrans.volquete,
        teletran: teletrans.teletrans,
        total: teletrans.total,
        trabajador_asistencia: subAsistencias,
        cargo: contrato.puesto,
        asistencia: asistenciasValidas,
        asistencia_completa: asistenciaCompleta,
        estado: aprobacionFiltered.estado,
        aprobacion_id: aprobacionFiltered.id,
        firma_jefe: aprobacionFiltered.firma_jefe,
        firma_gerente: aprobacionFiltered.firma_gerente,
        foto: aprobacionFiltered.huella,
      });

      subarrayId++;
    };

    if (!filterContrato) {
      return;
    }
    filterContrato.map((trabajador) => {
      const tareo = trabajador.trabajador_contratos[0].contrato.tareo;
      if (tareo === "Lunes a sabado") {
        let contador = 0;
        let subAsistencias = [];
        let fechaInicio = null;
        let fechaFin = null;

        const minAsistencias = 15;
        const sortedAsistencias =
          trabajador?.trabajador_contratos[0]?.trabajador_asistencia?.sort(
            (a, b) => a.asistencium.fecha.localeCompare(b.asistencium.fecha)
          );

        const numAsistencias = sortedAsistencias.length;

        if (numAsistencias >= 1) {
          for (let i = 0; i < numAsistencias; i++) {
            const asistencia = sortedAsistencias[i];

            subAsistencias.push(asistencia);

            if (
              ["Asistio", "Comisión"].includes(asistencia.asistencia) &&
              contador < minAsistencias
            ) {
              contador++;
            }

            if (contador === 1 && !fechaInicio) {
              fechaInicio = asistencia.asistencium.fecha;
            }

            // Creamos subarray cuando se alcance el número exacto de asistencias.
            if (contador === minAsistencias || i === numAsistencias - 1) {
              fechaFin = asistencia.asistencium.fecha;

              createSubarray(
                trabajador,
                subAsistencias,
                fechaInicio,
                fechaFin,
                contador
              );

              // Preparación para el siguiente subarray
              contador = 0; // Reiniciamos el contador
              subAsistencias = []; // Limpiamos el arreglo de asistencias
              fechaInicio = null; // Reiniciamos la fecha de inicio
            }
          }
        }
      } else if (tareo === "Mes cerrado") {
        const sortedAsistencias =
          trabajador?.trabajador_contratos[0]?.trabajador_asistencia?.sort(
            (a, b) => a.asistencium.fecha.localeCompare(b.asistencium.fecha)
          );

        let subAsistencias = [];
        let fechaInicio = null;
        let fechaFin = null;

        let splitDay;
        let currentMonth;

        // Contador de subarreglos
        let subarrayCount = 0;

        sortedAsistencias.forEach((asistencia, i) => {
          const fechaAsistencia = dayjs(asistencia.asistencium.fecha);
      
          if (!fechaInicio) {
              fechaInicio = asistencia.asistencium.fecha;
              const daysInMonth = fechaAsistencia.daysInMonth();
              if (daysInMonth === 31) {
                  splitDay = 16;
              } else if (daysInMonth === 30 || daysInMonth === 29) {
                  splitDay = 15;
              } else {
                  splitDay = 14;
              }
          }
      
          subAsistencias.push(asistencia);
            
          if (i === sortedAsistencias.length - 1 || subAsistencias.length === splitDay) {
              fechaFin = asistencia.asistencium.fecha;
              createSubarray(trabajador, subAsistencias, fechaInicio, fechaFin, subAsistencias.length);
      
              // Reiniciamos el subarray y la fecha de inicio
              fechaInicio = fechaAsistencia.add(1, "day").format("YYYY-MM-DD");
              subAsistencias = [];
              
              // Determinamos el splitDay para el próximo subarray
              splitDay = fechaAsistencia.daysInMonth() - splitDay;
          }
      });

        if (subAsistencias.length > 0) {
          // Asegurándonos de agregar el último subarray si hay asistencias pendientes
          createSubarray(
            trabajador,
            subAsistencias,
            fechaInicio,
            fechaFin,
            subAsistencias.length
          );
        }
      }
    });

    return res.status(200).json({ data: aprobacionFilter });
  } catch (error) {
    console.log(error);
    res.status(500).json;
  }
};

// para obtener el tareo de las asocicaiones
const getTareoAsociacion = async (req, res, next) => {
  const id = req.params.id;

  try {
    const asociaciones = await asociacion.findAll({
      where: { id: id },
      include: [
        {
          model: contrato,
          attributes: { exclude: ["contrato_id"] },
          where: { finalizado: false },

          include: [
            { model: teletrans },
            { model: aprobacion_contrato_pago },
            {
              model: trabajador_contrato,
              include: [
                {
                  model: trabajador,
                  attributes: { exclude: ["usuarioId"] },
                },
                {
                  model: trabajadorAsistencia,
                  attributes: ["asistencia"],
                  include: [{ model: asistencia }],
                },
              ],
            },
          ],
        },
      ],
    });

    const asociacionData = asociaciones.map((asociacion) => {
      return asociacion.contratos.flatMap((contrato) => {
        let fechaInicio = dayjs(contrato.fecha_inicio, [
          "YYYY-MM-DD",
          "YYYY-MM-DD HH:mm:ss",
        ]).toDate();
        let fechaFin = dayjs(contrato.fecha_fin, [
          "YYYY-MM-DD",
          "YYYY-MM-DD HH:mm:ss",
        ]).toDate();
        let fechaInicioData = dayjs(contrato.fecha_inicio);
        let fechaFinData =
          dayjs(contrato.fecha_fin_estimada) || dayjs(contrato.fecha_fin);

        if (fechaInicio.getTime() > fechaFin.getTime()) {
          return [];
        }

        let subarrays = [];
        let subarrayId = 1;

        const trabajadores = contrato.trabajador_contratos.map(
          (tc) => tc.trabajador
        );
        const trabajador_asistencia = contrato.trabajador_contratos.map(
          (tc) => tc.trabajador_asistencia
        )[0];

        let fechaInicioSubarray = null;
        let fechaFinSubarray = null;
        let asistenciasPrimerTrabajador;
        let trabajadorMenorCodigo;

        if (trabajadores && trabajadores.length > 0) {
          trabajadorMenorCodigo = contrato.trabajador_contratos.reduce(
            (prev, curr) => {
              return prev.trabajador.codigo_trabajador <
                curr.trabajador.codigo_trabajador
                ? prev
                : curr;
            }
          );
          asistenciasPrimerTrabajador =
            trabajadorMenorCodigo?.trabajador_asistencia?.sort((a, b) => {
              const dateA = dayjs(a.asistencium.fecha, [
                "YYYY-MM-DD",
                "YYYY-MM-DD HH:mm:ss",
              ]).toDate();
              const dateB = dayjs(b.asistencium.fecha, [
                "YYYY-MM-DD",
                "YYYY-MM-DD HH:mm:ss",
              ]).toDate();

              return dateA - dateB;
            });
        } else {
          trabajadorMenorCodigo = null;
          asistenciasPrimerTrabajador = [];
        }

        let contador = 0;
        let subAsistencias = [];
        const minAsistencias = 15;
        let currentIndex = 0;

        while (currentIndex < asistenciasPrimerTrabajador.length) {
          let asistencia = asistenciasPrimerTrabajador[currentIndex];
          if (
            asistencia?.asistencia === "Asistio" ||
            asistencia?.asistencia === "Comisión"
          ) {
            contador++;
            subAsistencias.push(asistencia);
            if (contador === 1) {
              fechaInicioSubarray = asistencia.asistencium.fecha;
            }
          }

          if (
            contador === minAsistencias ||
            currentIndex === asistenciasPrimerTrabajador.length - 1
          ) {
            fechaFinSubarray = asistencia.asistencium.fecha;

            let validDates = new Set(
              subAsistencias.map((asistencia) =>
                dayjs(asistencia?.asistencium?.fecha, [
                  "YYYY-MM-DD",
                  "YYYY-MM-DD HH:mm:ss",
                ]).format("YYYY-MM-DD")
              )
            );

            const trabajadores = contrato.trabajador_contratos.map(
              (trabajador) => {
                const asistenciasArray = Array.from(validDates).reduce(
                  (acc, fecha) => {
                    const asistencia =
                      trabajador?.trabajador_asistencia &&
                      trabajador?.trabajador_asistencia.find(
                        (asistencia) =>
                          dayjs(asistencia.asistencium.fecha).format(
                            "YYYY-MM-DD"
                          ) === fecha
                      )?.asistencia;

                    acc[fecha] =
                      asistencia === "Permiso"
                        ? "P"
                        : asistencia === "Asistio"
                        ? "X"
                        : asistencia === "Falto"
                        ? "F"
                        : asistencia === "Dia libre"
                        ? "DL"
                        : asistencia === "Comision"
                        ? "C"
                        : "";
                    return acc;
                  },
                  {}
                );
                return {
                  dni: trabajador?.trabajador?.dni,
                  nombres:
                    trabajador?.trabajador?.apellido_paterno +
                    " " +
                    trabajador?.trabajador?.apellido_materno +
                    " " +
                    trabajador?.trabajador?.nombre,
                  celular: trabajador?.trabajador?.telefono,
                  ...asistenciasArray,
                  estado: trabajador?.trabajador?.trabajador_contratos,
                };
              }
            );

            const aprobacionData = contrato.aprobacion_contrato_pagos
              ?.filter((item) => item.subarray_id == subarrayId)
              .slice(-1)[0];
            subarrays.push({
              subarray_id: subarrayId,
              nombre: asociacion.nombre,
              asociacion_id: asociacion.id,
              fecha_inicio: dayjs(fechaInicioSubarray).format("DD-MM-YYYY"),
              fecha_fin: dayjs(fechaFinSubarray).format("DD-MM-YYYY"),
              asistencia: contador,
              trabajadores: trabajadores,
              estado: aprobacionData?.estado,
              aprobacion_id: aprobacionData?.id,
              firma_jefe: aprobacionData?.firma_jefe,
              firma_gerente: aprobacionData?.firma_gerente,
              observaciones: aprobacionData?.observaciones,
            });

            subarrayId++;
            contador = 0;
            subAsistencias = [];
            fechaInicioSubarray = null;
          }
          currentIndex++;
        }

        return subarrays;
      });
    });

    res.status(200).json({ data: asociacionData.flat() });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const juntarTeletrans = async (req, res, next) => {
  try {
    const getTrabajador = await trabajador.findAll({
      where: { asociacion_id: { [Op.is]: null } },
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajadorAsistencia,
          attributes: {
            exclude: ["trabajadorId", "asistenciumId", "trabajadorDni"],
          },
        },
        {
          model: contrato,
          attributes: { exclude: ["contrato_id"] },
          where: {
            [Op.and]: [{ finalizado: { [Op.not]: true } }],
          },
          include: [{ model: teletrans }],
        },
      ],
    });

    const filterAsistencia = getTrabajador
      ?.map((item, i) => {
        return {
          id: i + 1,
          dni: item?.dni,
          codigo_trabajador: item?.codigo_trabajador,
          fecha_nacimiento: item?.fecha_nacimiento,
          telefono: item?.telefono,
          nombre:
            item?.nombre +
            " " +
            item?.apellido_paterno +
            " " +
            item?.apellido_materno,
          saldo: item.contratos.at(-1).teletrans.at(-1).saldo,
          trabajador_asistencia: item?.trabajador_asistencia,
          contrato: item?.contratos,
          asistencias: item?.trabajador_asistencia?.filter(
            (data) => data.asistencia === "Asistio"
          ).length,
          nro_quincena:
            parseInt(
              item?.trabajador_asistencia?.filter(
                (data) => data.asistencia === "Asistio"
              ).length
            ) / 15,
        };
      })
      .filter(
        (item) =>
          item.asistencias !== 0 &&
          item.asistencias % 15 === 0 &&
          parseInt(item.saldo) % 4 !== 0
      )
      .flat();

    const filter = filterAsistencia
      .map((item) => {
        return {
          nombre: item?.nombre,
          telefono: item?.telefono,
          dni: item?.dni,
          volquete: parseInt(
            item?.contrato?.at(-1)?.teletrans?.at(-1)?.volquete
          ),
          teletrans: parseInt(
            item?.contrato?.at(-1)?.teletrans?.at(-1)?.teletrans
          ),
          saldo: parseInt(item?.saldo),
          dias_laborados: item?.trabajador_asistencia.filter(
            (data) => data?.asistencia === "Asistio"
          ).length,
          contrato_id: item?.contrato?.at(-1).id,
          contrato: item?.contrato,
        };
      })
      .flat();

    return res.status(200).json({ data: filter });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const updateFechaPago = async (req, res, next) => {
  id = req.params.id;

  try {
    const get = await fecha_pago.update({ where: { contrato_id: id } });

    res.status(500).json({ msg: "Actualizado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const updatepagoAsociacion = async (req, res, next) => {
  let pago_id = req.params.id;
  const totalTeletrans = req?.body?.trabajadores?.reduce(
    (acc, value) => acc + parseFloat(value.teletrans),
    0
  );
  let info = {
    observacion: req.body.observacion,
    fecha_pago: req.body.fecha_pago,
    contrato_id: req.body.contrato_id,
    volquetes: req.body.volquetes,
    teletrans: req.body.teletrans,
  };
  try {
    if (!req.body.trabajadores) {
      let update = await pago.update(info, {
        where: { id: pago_id },
      });
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

    if (req?.body?.trabajadores?.length > 1 && totalTeletrans % 4 === 0) {
      let update = await pago.update(info, { where: { id: pago_id } });

      const getContratoPago = await contrato_pago.findAll({
        where: { pago_id: pago_id },
        attributes: { exclude: ["contrato_pago_id"] },
      });
      const contratoPagoId = getContratoPago?.at(-1)?.id;
      const destoryPagoAsociacion = await pago_asociacion.destroy({
        where: { contrato_pago_id: contratoPagoId },
      });
      const delPagoContrato = await contrato_pago.destroy({
        where: { pago_id: pago_id },
      });

      let contra_pago = {
        pago_id: pago_id,
        contrato_id: req.body.contrato_id,
        volquetes: req?.body.volquetes,
        teletrans: req?.body.teletrans,
      };
      const pagoContrato = await contrato_pago.create(contra_pago);

      let asociacionPago = req.body.trabajadores.map((item) => {
        return {
          teletrans: item.teletrans,
          trabajador_dni: item.trabajador_dni,
          contrato_pago_id: pagoContrato.id,
        };
      });

      const asociPago = await pago_asociacion.bulkCreate(asociacionPago, {
        ignoreDuplicates: false,
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
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const updateTrabajadorAsistencia = async (req, res, next) => {
  let id = req.params.id;
  const {
    contrato_id,
    firma_jefe,
    firma_gerente,
    huella,
    tipo,
    estado,
    subarray_id,
    observaciones,
  } = req.body;

  try {
    let aprobacionData;
    console.log(req.body);
    if (id === "0") {
      // Si id es 0, crear una nueva aprobación
      aprobacionData = await aprobacion_contrato_pago.create({
        contrato_id,
        tipo,
        firma_jefe,
        firma_gerente,
        estado,
        subarray_id,
      });

      return res.status(200).json({
        msg: "Aprobación actualizada con éxito!",
        status: 200,
      });
    } else {
      // Si id es distinto de 0, actualizar una aprobación existente
      aprobacionData = await aprobacion_contrato_pago.findOne({
        where: { id: id },
      });

      if (aprobacionData) {
        // Verificar si la aprobación ya fue aprobada y no puede ser actualizada
        if (
          aprobacionData.firma_jefe &&
          aprobacionData.firma_gerente &&
          aprobacionData.estado === true
        ) {
          return res.status(400).json({
            msg: "La aprobación ya fue aprobada y no puede ser modificada.",
            status: 400,
          });
        }

        // Si ya existe, actualizar los valores
        aprobacionData.firma_jefe = firma_jefe;
        aprobacionData.firma_gerente = firma_gerente;
        aprobacionData.subarray_id = subarray_id;
        aprobacionData.observaciones = observaciones;

        await aprobacionData.save();

        aprobacionDataActulizado = await aprobacion_contrato_pago.findOne({
          where: { id: id },
        });
        if (
          aprobacionDataActulizado.firma_jefe &&
          aprobacionDataActulizado.firma_gerente
        ) {
          aprobacionDataActulizado.estado = true;
        } else {
          aprobacionDataActulizado.estado = false;
        }

        aprobacionDataActulizado.save();
        return res.status(200).json({
          msg: "Aprobación actualizada con éxito!",
          status: 200,
        });
      }
    }

    return res.status(404).json({
      msg: "No se actualizar.",
      status: 404,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const updateHuella = async (req, res, next) => {
  let id = req.params.id;
  try {
    let info;
    if (req.file && req?.body?.huella !== undefined && req.body.huella !== "") {
      const fileDir = require("path").resolve(__dirname, `./upload/images/`);

      const editFotoLink = req.body.huella.split("/").at(-1);
      fs.unlink("./upload/images/" + editFotoLink, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("eliminado con éxito!");
        }
      });
    }
    info = {
      huella: req.file
        ? process.env.LOCAL_IMAGE + req.file.filename
        : req.body.huella,
      // estado: true,
    };
    const putAsistencia = await aprobacion_contrato_pago.update(info, {
      where: { id: id },
    });
    return res.status(200).json({ msg: "Registrado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo registrar.", status: 500 });
  }
};

module.exports = {
  getPlanilla,
  campamentoPlanilla,
  getTareoTrabajador,
  getTareoAsociacion,
  juntarTeletrans,
  getPlanillaPago,
  getListaPago,
  getListaAsociacionProgramada,
  updatepagoAsociacion,
  updateTrabajadorAsistencia,
  updateHuella,
  getPlanillaHistoriaTrabajador,
};
