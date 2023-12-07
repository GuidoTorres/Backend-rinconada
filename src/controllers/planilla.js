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
  trabajador_contrato,
  aprobacion_contrato_pago,
  area,
  cargo,
  gerencia,
  sequelize,
  detalle_pago,
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
            "relevo",
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
          const fechaAsistencia = dayjs(data?.asistencium?.fecha);
          return (
            ((fechaAsistencia.isSame(fechaInicioContrato) ||
              fechaAsistencia.isAfter(fechaInicioContrato)) &&
              (fechaAsistencia.isSame(fechaFinContrato) ||
                fechaAsistencia.isBefore(fechaFinContrato)) &&
              data.asistencia === "Asistio") ||
            data.asistencia === "Comisión" ||
            data.asistencia === "Permiso remunerado" ||
            data.asistencia === "Vacaciones" ||
            data.asistencia === "Descanso medico" ||
            data.asistencia === "Dia Libre"
          );
        }
      ).length;

      console.log(asistencia);

      return {
        nombre: item?.nombre,
        asociacion_id: item?.id,
        codigo: item?.codigo,
        fecha_inicio: fechaInicioContrato.format("DD-MM-YYYY"),
        fecha_fin: fechaFinContrato.format("DD-MM-YYYY"),
        contratos: contrato,
        volquete: contrato?.teletrans[0]?.volquete,
        campamento: contrato?.campamento?.nombre.toString(),
        teletran: contrato?.teletrans[0]?.teletrans,
        total: contrato?.teletrans[0]?.total,
        saldo: contrato?.teletrans[0]?.saldo,
        relevo: "---",

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
        const fechaAsistencia = dayjs(data?.asistencium?.fecha);
        return (
          ((fechaAsistencia.isSame(fechaInicio) ||
            fechaAsistencia.isAfter(fechaInicio)) &&
            (fechaAsistencia.isSame(fechaFin) ||
              fechaAsistencia.isBefore(fechaFin)) &&
            data.asistencia === "Asistio") ||
          data.asistencia === "Comisión" ||
          data.asistencia === "Permiso remunerado" ||
          data.asistencia === "Vacaciones" ||
          data.asistencia === "Descanso medico" ||
          data.asistencia === "Dia Libre"
        );
      }).length;
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
        relevo: contrato?.relevo,
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
    const allAprobaciones = await aprobacion_contrato_pago.findAll({
      where: { asociacion_id: { [Op.not]: null }, pagado: { [Op.not]: true } },
      attributes: [
        "id",
        "estado",
        "contrato_id",
        "fecha_inicio",
        "subarray_id",
        "fecha_fin",
        "asociacion_id",
        "observaciones",
      ],
      include: [
        {
          model: asociacion,
          attributes: ["id", "nombre", "tipo"],
          where: {
            id: sequelize.col("aprobacion_contrato_pago.asociacion_id"),
          },
          required: false,
          include: [{ model: detalle_pago, include: [{ model: pago }] }],
        },
        {
          model: contrato,
          attributes: ["id", "fecha_inicio", "fecha_fin"],
          include: [
            {
              model: trabajador_contrato,
              attributes: ["id"],
              include: [
                {
                  model: trabajador,
                  attributes: [
                    "dni",
                    "nombre",
                    "apellido_paterno",
                    "apellido_materno",
                  ],
                },
              ],
            },
            { model: teletrans },
          ],
        },
      ],
    });

    const formatData = allAprobaciones?.map((item, i) => {
      // Obtener los detalle_pagos que pertenecen a la misma quincena
      const detallesProgramados = item?.asociacion?.detalle_pagos?.filter(
        (detalle) => parseInt(detalle.quincena) === parseInt(item.subarray_id)
      );
      const totalDetallePago = detallesProgramados.reduce(
        (acc, detalle) => acc + (detalle.monto || 0),
        0
      );

      const totalVolquetes = totalDetallePago;

      const pagos = {
        trabajadores: item?.contrato?.trabajador_contratos
          .map((trabajador, i) => {
            const detallePago = detallesProgramados.find(
              (detalle) => detalle.trabajador_contrato_id === trabajador.id
            );
            const montoProgramado = detallePago ? detallePago.monto : 0;

            return {
              id: i + 1,
              teletrans: montoProgramado,
              dni: trabajador.trabajador.dni,
              nombre: `${trabajador.trabajador.apellido_paterno} ${trabajador.trabajador.apellido_materno} ${trabajador.trabajador.nombre}`,
              telefono: trabajador.trabajador.telefono,
              cargo: item.tipo,
              programado: montoProgramado > 0,
              contrato_id: item?.contrato?.id,
              asociacion_id: item?.asociacion?.id,
              trabajador_contrato_id:
                item?.contrato?.trabajador_contratos.filter(
                  (data) => data.trabajador.dni === trabajador.trabajador.dni
                )[0]?.id,
            };
          })
          .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      };

      const saldoFinal =
        parseFloat(item?.contrato?.teletrans[0]?.saldo || 0) - totalDetallePago;

      // if (saldoFinal < 1) {
      //   updateEstadoAprobacionContratoPago(item.id);
      // }
      return {
        id: i + 1,
        dni: "---",
        nombre: item?.asociacion.nombre + " - " + item.subarray_id,
        tipo: item?.asociacion.tipo,
        asociacion_id: item?.asociacion.id,
        contrato_id: item?.contrato?.id,
        aprobacion: {
          id: item.id,
          estado: item.estado,
          fecha_inicio: item.fecha_inicio,
          subarray_id: item.subarray_id,
          fecha_fin: item.fecha_fin,
          asociacion_id: item.asociacion_id,
          observaciones: item.observaciones,
        },
        saldo: saldoFinal,
        total_modificado: saldoFinal,
        total: item?.contrato?.pago?.monto_total,
        volquete: item?.contrato?.teletrans[0]?.volquete,
        teletran: item?.contrato?.teletrans[0]?.teletrans || 0,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        pagos: pagos,
        quincena: item.subarray_id,
        estado: item.estado,
        totalVolquetes: totalVolquetes,
      };
    });

    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};


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

    const aprobacionFilter = [];
    let subarrayId = 1;

    trabajadores?.map((trabajador) => {
      const tareo = trabajador?.trabajador_contratos[0]?.contrato.tareo;
      const trabajadorContrato = trabajador?.trabajador_contratos[0];

      if (tareo === "Lunes a sabado" || tareo === "Lunes a domingo") {
        const minAsistencias = 15;
        let contador = 0;
        let subAsistencias = [];
        let fechaInicio = null;
        let fechaFin = null;
        const sortedAsistencias = ordenarAsistencia(
          trabajadorContrato?.contrato?.fecha_inicio,
          trabajadorContrato?.contrato?.fecha_fin_estimada,
          trabajadorContrato?.trabajador_asistencia
        );

        const numAsistencias = sortedAsistencias.length;

        if (numAsistencias >= 1) {
          for (let i = 0; i < numAsistencias; i++) {
            const asistencia = sortedAsistencias[i];

            subAsistencias.push(asistencia);

            if (
              [
                "Asistio",
                "Comisión",
                "Dia Libre",
                "Permiso remunerado",
                "Vacaciones",
                "Descanso medico",
              ].includes(asistencia.asistencia) &&
              contador < minAsistencias
            ) {
              contador++;
            }

            if (contador === 1 && !fechaInicio) {
              fechaInicio = asistencia.asistencium.fecha;
            }
            if (contador === minAsistencias || i === numAsistencias - 1) {
              fechaFin = asistencia.asistencium.fecha;

              createSubarray(
                trabajador,
                subAsistencias,
                fechaInicio,
                fechaFin,
                contador,
                subarrayId,
                aprobacionFilter
              );

              contador = 0;
              subAsistencias = [];
              fechaInicio = null;
            }
          }
        }
      } if (tareo === "Mes cerrado") {
        const fechaInicioDay = trabajadorContrato?.contrato?.fecha_inicio;
        const asistencias = trabajadorContrato?.trabajador_asistencia || [];
        const sortedAsistencias = [...asistencias].sort((a, b) =>
            a.asistencium.fecha.localeCompare(b.asistencium.fecha)
        );
    
        const getAsistenciaForDay = (fecha) => {
          return sortedAsistencias.find((data) =>
              dayjs(data?.asistencium?.fecha).isSame(fecha)
          );
      };
      
    
        let currentDate = dayjs(fechaInicioDay);
        const fechaDeUltimaAsistencia = dayjs(
            sortedAsistencias[sortedAsistencias.length - 1]?.asistencium?.fecha
        );
    
        let subAsistencias = [];
        let subarrayCount = 0;
        let lastSubarrayLength = 0; // Guardamos la longitud del último subarray


        while (!currentDate.isAfter(fechaDeUltimaAsistencia)) {
          subarrayCount++;
      
          let daysForThisSubarray;
          console.log(lastSubarrayLength);
          if (subarrayCount % 2 === 1) { // Subarray impar
            daysForThisSubarray = (currentDate.daysInMonth() === 31) ? 16 : 15;
            lastSubarrayLength = daysForThisSubarray;
        } else { // Subarray par
          switch(currentDate.daysInMonth()) {
            case 31:
                daysForThisSubarray = 15;
                break;
            case 30:
                daysForThisSubarray = 15;
                break;
            case 29:
                daysForThisSubarray = 14;
                break;
            case 28:
                daysForThisSubarray = 13;
                break;
        }
        }
        
        
      
          for (let i = 0; i < daysForThisSubarray; i++) {
              const currentAsistencia = getAsistenciaForDay(currentDate.format("YYYY-MM-DD"));
              if (currentAsistencia) {
                  subAsistencias.push(currentAsistencia);
              }
              currentDate = currentDate.add(1, "day");
          }
      
          createSubarray(
              trabajador,
              subAsistencias,
              subAsistencias[0].asistencium.fecha,
              subAsistencias[subAsistencias.length - 1].asistencium.fecha,
              subAsistencias.length,
              subarrayId,
              aprobacionFilter
          );
      
          subAsistencias = [];
      }
      
    }
    
     else if (tareo === "20 dias") {
        const minAsistencias = 20;
        let contador = 0;
        let subAsistencias = [];
        let fechaInicio = null;
        let fechaFin = null;
        const sortedAsistencias = ordenarAsistencia(
          trabajadorContrato?.contrato?.fecha_inicio,
          trabajadorContrato?.contrato?.fecha_fin_estimada,
          trabajadorContrato?.trabajador_asistencia
        );

        const numAsistencias = sortedAsistencias.length;

        if (numAsistencias >= 1) {
          for (let i = 0; i < numAsistencias; i++) {
            const asistencia = sortedAsistencias[i];

            subAsistencias.push(asistencia);

            if (
              [
                "Asistio",
                "Comisión",
                "Dia Libre",
                "Permiso remunerado",
                "Vacaciones",
                "Descanso medico",
              ].includes(asistencia.asistencia) &&
              contador < minAsistencias
            ) {
              contador++;
            }

            if (contador === 1 && !fechaInicio) {
              fechaInicio = asistencia.asistencium.fecha;
            }
            if (contador === minAsistencias || i === numAsistencias - 1) {
              fechaFin = asistencia.asistencium.fecha;

              createSubarray(
                trabajador,
                subAsistencias,
                fechaInicio,
                fechaFin,
                contador,
                subarrayId,
                aprobacionFilter
              );

              contador = 0;
              subAsistencias = [];
              fechaInicio = null;
            }
          }
        }
      }
    });

    return res.status(200).json({ data: aprobacionFilter });
  } catch (error) {
    console.log(error);
    res.status(500).json;
  }
};

const ordenarAsistencia = (inicio, fin, asistencia) => {
  return asistencia
    ?.filter((data) => {
      const fechaAsistencia = dayjs(data?.asistencium?.fecha);
      return (
        (fechaAsistencia.isSame(inicio) || fechaAsistencia.isAfter(inicio)) &&
        (fechaAsistencia.isSame(fin) || fechaAsistencia.isBefore(fin))
      );
    })
    .sort((a, b) => a.asistencium.fecha.localeCompare(b.asistencium.fecha));
};

const createSubarray = (
  trabajador,
  subAsistencias,
  fechaInicio,
  fechaFin,
  contador,
  subarrayId,
  aprobacionFilter
) => {
  const fechaInicioDayjs = dayjs(fechaInicio);
  const fechaFinDayjs = dayjs(fechaFin);
  let asistenciasValidas = 0;

  console.log(fechaInicio);
  console.log(fechaFin);
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
    if (
      [
        "Asistio",
        "Comisión",
        "Dia Libre",
        "Permiso remunerado",
        "Vacaciones",
        "Descanso medico",
      ].includes(asistencia.asistencia)
    ) {
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
      asistencia: item?.asistencia || "Sin asistencia",
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
        let fechaFin = dayjs(contrato.fecha_fin_estimada, [
          "YYYY-MM-DD",
          "YYYY-MM-DD HH:mm:ss",
        ]).toDate();

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
            trabajadorMenorCodigo?.trabajador_asistencia
              ?.filter((data) => {
                const fechaAsistencia = dayjs(data?.asistencium?.fecha);
                return (
                  (fechaAsistencia.isSame(fechaInicio) ||
                    fechaAsistencia.isAfter(fechaInicio)) &&
                  (fechaAsistencia.isSame(fechaFin) ||
                    fechaAsistencia.isBefore(fechaFin))
                );
              })
              .sort((a, b) => {
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
            asistencia.asistencia === "Asistio" ||
            asistencia.asistencia === "Comisión" ||
            asistencia.asistencia === "Permiso remunerado" ||
            asistencia.asistencia === "Vacaciones" ||
            asistencia.asistencia === "Descanso medico" ||
            asistencia.asistencia === "Dia Libre"
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
  getPlanillaPago,
  getListaPago,
  getListaAsociacionProgramada,
  updateHuella,
  getPlanillaHistoriaTrabajador,
};
