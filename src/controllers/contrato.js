const {
  contrato,
  trabajador,
  evaluacion,
  teletrans,
  trabajador_contrato,
  aprobacion_contrato_pago,
  contrato_pago,
  sequelize,
  cargo,
  suspensiones,
  suspensiones_jefes,
  trabajadorAsistencia,
  asistencia,
  campamento,
  area,
} = require("../../config/db");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
// obtener lista de contratos
const getContrato = async (req, res, next) => {
  try {
    const get = await contrato.findAll({
      attributes: { exclude: ["contrato_id"] },
    });
    return res.status(200).json({ data: get });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

// obtener listat de contratos por el id del contrato
const getContratoById = async (req, res, next) => {
  let id = req.params.id;
  // obtener contrato de trabajador con el id de trabajador
  try {
    const user = await trabajador.findAll({
      where: { dni: id },
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajador_contrato,
          include: [
            {
              model: contrato,

              attributes: { exclude: ["contrato_id"] },
              include: [{ model: cargo, attributes: ["id", "nombre"] }],
            },
            { model: evaluacion },
          ],
        },
      ],
    });

    const format = user.map((item, i) => {
      return {
        nro: i + 1,
        dni: item?.dni,
        codigo_trabajador: item?.codigo_trabajador,
        fecha_nacimiento: item?.fecha_nacimiento,
        telefono: item?.telefono,
        apellido_paterno: item?.apellido_paterno,
        apellido_materno: item?.apellido_materno,
        nombre: item?.nombre,
        email: item?.email,
        estado_civil: item?.estado_civil,
        genero: item?.genero,
        direccion: item?.direccion,
        asociacion_id: item?.asociacion_id,
        deshabilitado: item?.deshabilitado,
        foto: item?.foto,
        suspendido: item?.suspendido,
        contratos: item.trabajador_contratos.map((data) => {
          const dataContrato = {
            estado: data?.estado,
            contrato_id: data.contrato_id,
            codigo_contrato: data.contrato?.codigo_contrato,
            tipo_contrato: data.contrato?.tipo_contrato,
            recomendado_por: data.contrato?.recomendado_por,
            cooperativa: data.contrato?.cooperativa,
            condicion_cooperativa: data.contrato?.condicion_cooperativa,
            periodo_trabajo: data.contrato?.periodo_trabajo,
            fecha_inicio: dayjs(data.contrato?.fecha_inicio)?.format(
              "YYYY-MM-DD"
            ),
            fecha_fin: dayjs(data.contrato?.fecha_fin)?.format("YYYY-MM-DD"),
            fecha_fin_estimada: dayjs(data.contrato?.fecha_fin)?.format(
              "YYYY-MM-DD"
            ),
            gerencia_id: data.contrato?.gerencia_id,
            area_id: data.contrato?.area_id,
            jefe_directo: data.contrato?.jefe_directo,
            base: data.contrato?.base,
            termino_contrato: data.contrato?.termino_contrato,
            nota_contrato: data.contrato?.nota_contrato,
            puesto_id: data.contrato?.puesto_id,
            campamento_id: data.contrato?.campamento_id,
            asociacion_id: data.contrato?.asociacion_id,
            evaluacion_id: data.contrato?.evaluacion_id,
            volquete: data.contrato?.volquete,
            teletran: data.contrato?.teletran,
            tareo: data.contrato?.tareo,
            finalizado: data?.contrato?.finalizado,
            suspendido: data?.contrato?.suspendido,
            cargo: data?.contrato?.cargo?.nombre,
            relevo: data?.contrato?.relevo,
          };

          return {
            contrato: dataContrato,
            evaluacion: data?.evaluacion,
          };
        }),
      };
    });

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
// obtener listat de contratos por el id del contrato de asociacion
const getContratoAsociacionById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const user = await contrato.findAll({
      attributes: { exclude: ["contrato_id"] },
      where: { asociacion_id: id },
    });

    const format = user.map((item, i) => {
      const fechaFormateada =
        item?.fecha_fin_estimada && dayjs(item.fecha_fin_estimada).isValid()
          ? dayjs(item.fecha_fin_estimada).format("YYYY-MM-DD")
          : item?.fecha_fin && dayjs(item.fecha_fin).isValid()
          ? dayjs(item.fecha_fin).format("YYYY-MM-DD")
          : null;
      return {
        nro: i + 1,
        id: item?.id,
        fecha_inicio_tabla: dayjs(item?.fecha_inicio)?.format("DD-MM-YYYY"),
        fecha_inicio: dayjs(item?.fecha_inicio)?.format("YYYY-MM-DD"),
        fecha_fin: fechaFormateada,
        codigo_contrato: item?.codigo_contrato,
        tipo_contrato: item?.tipo_contrato,
        periodo_trabajo: item?.periodo_trabajo,
        gerencia_id: item?.gerencia_id,
        area_id: item?.area_id,
        jefe_directo: item?.jefe_directo,
        base: item?.base,
        termino_contrato: item?.termino_contrato,
        nota_contrato: item?.nota_contrato,
        puesto: item?.puesto,
        campamento_id: item?.campamento_id,
        empresa_id: item?.empresa_id,
        asociacion_id: item?.asociacion_id,
        puesto_id: item?.puesto_id,
        estado: item?.estado,
        volquete: item?.volquete,
        teletran: item?.teletran,
        suspendido: item?.suspendido,
        finalizado: item?.finalizado,
        tareo: item?.tareo,
      };
    });

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
//crear contrato para trabajadores individuales
const postContrato = async (req, res, next) => {
  try {
    const trabajadorId = req.body.trabajador_id;

    if (!trabajadorId) {
      return res.status(500).json({
        msg: "No se pudo crear el contrato, el trabajador_id es requerido.",
        status: 500,
      });
    }

    // Comprobar si existe un registro con evaluacion_id para el trabajador
    const tieneEvaluacion = await trabajador_contrato.findOne({
      where: {
        trabajador_dni: trabajadorId,
        evaluacion_id: { [Op.ne]: null },
        estado: "Activo",
      },
    });

    if (!tieneEvaluacion) {
      return res.status(500).json({
        msg: "No se pudo registrar, el trabajador debe tener una evaluación antes de crear el contrato.",
        status: 500,
      });
    }

    // Comprobar si ya hay un contrato activo para el trabajador
    const contratoActivo = await trabajador_contrato.findOne({
      where: {
        trabajador_dni: trabajadorId,
        contrato_id: { [Op.ne]: null },
        estado: "Activo",
      },
    });

    if (contratoActivo) {
      return res.status(500).json({
        msg: "No se pudo registrar, el trabajador ya tiene un contrato activo.",
        status: 500,
      });
    }

    // Crear el contrato y actualizar trabajador_contrato con el contrato_id
    const obj = { ...req.body, fecha_fin_estimada: req.body.fecha_fin };
    const post = await contrato.create(obj);
    tieneEvaluacion.contrato_id = post.id;
    await tieneEvaluacion.save();

    let volquete = parseInt(req.body?.volquete) || 0;
    let teletran = parseInt(req.body?.teletran) || 0;
    let total = parseInt(volquete) * 4 + parseInt(teletran);

    const ttransInfo = {
      volquete: volquete,
      teletrans: teletran,
      total: total,
      saldo: total,
      contrato_id: post.id,
    };

    if (volquete !== "" && teletran !== "") {
      await teletrans.create(ttransInfo);
    }

    return res
      .status(200)
      .json({ msg: "Contrato creado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo crear el contrato.", status: 500 });
  }
};

// crear contrato para asociacion
const postContratoAsociacion = async (req, res, next) => {
  let info = {
    fecha_inicio: dayjs(req?.body?.fecha_inicio)?.format("YYYY-MM-DD"),
    codigo_contrato: req?.body?.codigo_contrato,
    tipo_contrato: req?.body?.tipo_contrato,
    recomendado_por: req?.body?.recomendado_por,
    cooperativa: req?.body?.cooperativa,
    condicion_cooperativa: req?.body?.condicion_cooperativa,
    periodo_trabajo: req?.body?.periodo_trabajo,
    fecha_fin: dayjs(req?.body?.fecha_fin)?.format("YYYY-MM-DD"),
    fecha_fin_estimada: dayjs(req?.body?.fecha_fin)?.format("YYYY-MM-DD"),
    gerencia_id: req?.body?.gerencia_id,
    area_id: req?.body?.area_id,
    jefe_directo: req?.body?.jefe_directo,
    base: req?.body?.base,
    termino_contrato: req?.body?.termino_contrato,
    nota_contrato: req?.body?.nota_contrato,
    puesto_id: req?.body?.puesto_id,
    campamento_id: req?.body?.campamento_id,
    asociacion_id: req?.body?.asociacion_id,
    evaluacion_id: req?.body?.evaluacion_id,
    volquete: req?.body?.volquete,
    teletran: req?.body?.teletran,
    suspendido: false,
    finalizado: false,
    tareo: req?.body?.tareo,
  };
  const transaction = await sequelize.transaction();
  try {
    if (req.body.trabajadores.length > 0) {
      // Crear contrato con transacción
      const post = await contrato.create(info, { transaction });
      const updatePromises = req.body.trabajadores.map(async (item) => {
        // Buscar el registro existente que coincida con trabajador_dni y evaluacion_id
        const existingRecord = await trabajador_contrato.findOne({
          where: { trabajador_dni: item, estado: "Activo" },
          transaction,
        });
        // Si se encuentra un registro existente, actualizarlo
        if (existingRecord) {
          return existingRecord.update(
            { contrato_id: post.id },
            { transaction }
          );
        }

        return null;
      });
      await Promise.all(updatePromises);
      // Crear trabajador_contrato con transacción

      if (post) {
        let volquete = parseInt(req.body?.volquete) || 0;
        let teletran = parseInt(req.body?.teletran) || 0;
        let total = parseInt(volquete) * 4 + parseInt(teletran);
        const ttransInfo = {
          volquete: volquete,
          teletrans: teletran,
          total: total,
          saldo: total,
          contrato_id: post.id,
        };
        // Crear teletrans con transacción
        const createtTrans = await teletrans.create(ttransInfo, {
          transaction, // incluir la transacción aquí
        });
        await transaction.commit(); // Confirmar la transacción
        return res
          .status(200)
          .json({ msg: "Contrato creado con éxito!", status: 200 });
      }
    } else {
      await transaction.rollback(); // Revocar la transacción
      return res
        .status(200)
        .json({ msg: "Evaluación de trabajadores incompletas!", status: 401 });
    }
  } catch (error) {
    await transaction.rollback(); // Revocar la transacción si se produjo un error
    res.status(500).json({ msg: "No se pudo crear el contrato.", status: 500 });
  }
};

//actualizar el contrato
const updateContrato = async (req, res, next) => {
  let id = req.params.id;
  try {
    let info = {
      ...req.body,
      fecha_fin_estimada: req.body.fecha_fin,
    };
    delete info.contrato_id;
    delete info.estado;

    await contrato.update(info, {
      where: { id: id },
    });

    let volquete = parseFloat(req.body?.volquete) || 0;
    let teletran = parseFloat(req.body?.teletran) || 0;
    let total = parseFloat(volquete) * 4 + parseFloat(teletran);

    const ttransInfo = {
      volquete: volquete.toString(),
      total: total.toString(),
      saldo: total.toString(),
      teletrans: teletran.toString(),
    };

    const prueba = await teletrans.update(ttransInfo, {
      where: { contrato_id: id },
    });
    if (req.body.suspendido) {
      // Obtener el trabajador asociado al contrato
      const trabajadorContrato = await trabajador_contrato.findOne({
        where: { contrato_id: id },
      });
      // Si existe una relación trabajador_contrato
      if (trabajadorContrato) {
        // Obtener el trabajador asociado al contrato
        const trabajadorSuspendido = await trabajador.findOne({
          where: { dni: trabajadorContrato.trabajador_dni },
          attributes: { exclude: ["usuarioId"] },
        });

        // Actualizar el campo 'finalizado' en la tabla de contrato activo
        await contrato.update(
          { suspendido: true, finalizado: true },
          { where: { id: id, finalizado: false } }
        );

        // Actualizar las evaluaciones activas relacionadas con el trabajador
        await evaluacion.update(
          { suspendido: true, finalizado: true },
          {
            where: {
              trabajador_id: trabajadorSuspendido.dni,
              finalizado: false,
            },
          }
        );
      }
    }

    return res
      .status(200)
      .json({ msg: "Contrato actualizado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "No se pudo actualizar el contrato.", status: 500 });
  }
};

//eliminar contrato
const deleteContrato = async (req, res, next) => {
  let id = req.params.id;
  try {
    await teletrans.destroy({ where: { contrato_id: id } });


    await aprobacion_contrato_pago.destroy({
      where: { contrato_id: id },
    });
    await trabajador_contrato.update(
      { contrato_id: null },
      {
        where: { contrato_id: id },
      }
    );
    await contrato.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Contrato eliminado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "No se pudo eliminar el contrato", status: 500 });
  }
};
//obtener el ultimo id de las lista de contratos
const getLastId = async (req, res, next) => {
  try {
    const contratos = await contrato.findAll({
      order: [["id", "DESC"]],
      attributes: ["id"],
    });
    const nuevoId =
      contratos?.length > 0 ? parseInt(contratos?.at(0)?.id) + 1 : 1;
    return res.status(200).json({ data: nuevoId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo obtener", status: 500 });
  }
};

// cambiar el estado del contrato de finalizado a activo o viceversa
const activarContrato = async (req, res) => {
  let id = req.params.id;
  try {
    const contratoEvaluacion = await trabajador_contrato.findOne({
      where: { contrato_id: id },
    });

    const contratoActual = await contrato.findOne({
      where: { id: contratoEvaluacion.contrato_id },
      attributes: { exclude: ["contrato_id"] },
    });

    const evaluacionActual = await evaluacion.findOne({
      where: { id: contratoEvaluacion.evaluacion_id },
    });

    if (!contratoActual) {
      return res.status(404).json({ msg: "No se encontró el contrato" });
    }

    await contrato.update(
      { finalizado: !contratoActual.finalizado },
      { where: { id: contratoEvaluacion.contrato_id } }
    );
    await evaluacion.update(
      { finalizado: !evaluacionActual.finalizado },
      { where: { id: contratoEvaluacion.evaluacion_id } }
    );

    if (contratoActual.finalizado) {
      contratoEvaluacion.estado = "Finalizado";
      contratoEvaluacion.save();
    } else {
      contratoEvaluacion.estado = "Activo";
      contratoEvaluacion.save();
    }

    return res.status(200).json({
      msg: `Se ${
        !contratoActual.finalizado === true ? "finalizó" : "activó"
      } el contrato con éxito!`,
      status: 200,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "No se pudo cambiar el estado del contrato", status: 500 });
  }
};
const getTrabajadorContratoEvaluacion = async (req, res, next) => {
  try {
    const trabajadores = await trabajador.findAll({
      attributes: { exclude: ["usuarioId"] },
      include: [
        {
          model: trabajador_contrato,
          include: [{ model: contrato, attributes: ["id"] }],
        },
        { model: evaluacion, attributes: ["id"] },
      ],
    });
    trabajadores.forEach(async (trabajador) => {
      const { evaluacions, trabajador_contratos } = trabajador;

      const evaluacionesOrdenadas = evaluacions.sort((a, b) => a.id - b.id);
      const contratosOrdenados = trabajador_contratos
        .map((tc) => tc.contrato_id)
        .sort((a, b) => a - b);

      await Promise.all(
        contratosOrdenados.map(async (contratoId, index) => {
          if (evaluacionesOrdenadas[index]) {
            const evaluacionId = evaluacionesOrdenadas[index].id;

            // Actualizar la tabla trabajador_contrato con la relación
            await trabajador_contrato.update(
              { evaluacion_id: evaluacionId },
              {
                where: {
                  trabajador_dni: trabajador.dni,
                  contrato_id: contratoId,
                },
              }
            );

            // Realizar otras operaciones necesarias aquí
          }
        })
      );
    });
    res.status(200).json({ message: "Actualización exitosa" });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const updateAllContratos = async (req, res) => {
  try {
    // Obtener todos los contratos
    const contratos = await contrato.findAll({
      attributes: { exclude: ["contrato_id"] },
    });

    for (const contrato of contratos) {
      const { id, finalizado, suspendido } = contrato;

      let nuevoEstado;

      if (suspendido) {
        nuevoEstado = "Suspendido";
      } else if (finalizado) {
        nuevoEstado = "Finalizado";
      } else {
        nuevoEstado = "Activo";
      }

      // Actualizar el estado en trabajador_contrato_evaluacion
      await trabajador_contrato.update(
        { estado: nuevoEstado },
        {
          where: {
            contrato_id: id,
          },
        }
      );
    }
    res.send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: error.message });
  }
};

const registrarSuspension = async (req, res) => {
  const {
    nombre,
    fecha_suspension,
    descripcion,
    observacion,
    duracion,
    nivel_falta,
    encargado_suspender,
    terminado,
    indeterminado,
    estado,
    jefes,
    cargo,
    cooperativa,
    dni,
    contrato_id,
    tipo,
  } = req.body;

  // Iniciar una transacción
  const t = await sequelize.transaction();

  try {
    const traba_contrato = await trabajador_contrato.findOne({
      where: {
        trabajador_dni: dni,
        contrato_id: contrato_id,
      },
      include: [
        {
          model: trabajador,
          attributes: [
            "apellido_paterno",
            "apellido_materno",
            "nombre",
            "dni",
            "asociacion_id",
          ],
        },
        {
          model: contrato,
          attributes: ["id","fecha_inicio", "fecha_fin", "volquete", "teletran"],
          include: [
            {
              model: aprobacion_contrato_pago,
              attributes: ["fecha_inicio", "fecha_fin", "subarray_id"],
            },
          ],
        },
        evaluacion,
        {
          model: trabajadorAsistencia,
          attributes: ["asistencia"],
          include: [{ model: asistencia, attributes: ["fecha"] }],
        },
      ],
    });

    if (!traba_contrato) {
      return res
        .status(500)
        .json({ msg: "No se encontro el contrato.", status: 500 });
    }
    const ultimoTareo =
      traba_contrato?.contrato?.aprobacion_contrato_pagos.at(-1);
    let fechaIni;
    if (ultimoTareo) {
      const fechaString = ultimoTareo?.fecha_fin;
      const partes = fechaString.split("-");
      const fechaReformateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
      const fechaObjeto = new Date(fechaReformateada);
      fechaIni = dayjs(fechaObjeto);
    } else {
      const fechaString1 = traba_contrato?.contrato?.fecha_inicio;
      console.log(traba_contrato?.contrato?.fecha_inicio);
      const partes1 = fechaString1?.split("-");
      const fechaReformateada1 = `${partes1[2]}-${partes1[1]}-${partes1[0]}`;
      const fechaObjeto1 = new Date(fechaReformateada1);
      fechaIni = dayjs(fechaObjeto1);
    }
    const asistencias = traba_contrato.trabajador_asistencia;
    const diasAsistencia = asistencias?.filter(
      (asistencia) =>
        dayjs(asistencia?.asistencium?.fecha).isAfter(fechaIni) &&
        [
          "Asistio",
          "Comisión",
          "Permiso remunerado",
          "Vacaciones",
          "Descanso medico",
          "Dia Libre",
        ].includes(asistencia.asistencia)
    ).length;

    if (diasAsistencia) {
      const fechaFin = dayjs(fechaIni)
        .add(diasAsistencia, "day")
        .format("YYYY-MM-DD");
      const traba = traba_contrato.trabajador;
      const dataTareo = {
        contrato_id: contrato_id,
        fecha_inicio: fechaIni.format("DD-MM-YYYY"),
        fecha_fin: dayjs(fechaFin).format("DD-MM-YYYY"),
        nombre:
          traba.apellido_paterno +
          " " +
          traba.apellido_materno +
          " " +
          traba.nombre,
        dias_laborados: diasAsistencia,
        subarray_id: ultimoTareo ? parseInt(ultimoTareo.subarray_id) + 1 : 1,
        volquete: traba_contrato.contrato.volquete,
        teletran: traba_contrato.contrato.teletran,
        asociacion_id: traba.asociacion_id,
        dni: traba.dni,
      };

      await aprobacion_contrato_pago.create(dataTareo, { transaction: t });
    }
    const fechaInicio = dayjs(fecha_suspension);
    const fechaCumplimiento = fechaInicio
      .add(parseInt(duracion), "month")
      .format("YYYY-MM-DD");
    // Crear la suspensión
    const suspension = await suspensiones.create(
      {
        nombre,
        fecha_suspension,
        descripcion,
        observacion,
        duracion,
        fecha_cumplimiento: fechaCumplimiento,
        nivel_falta,
        encargado_suspender,
        estado,
        terminado: false,
        indeterminado: duracion === "0" ? true : false,
        cargo,
        cooperativa,
        dni,
        trabajador_contrato_id: traba_contrato.id,
      },
      { transaction: t }
    );

    // Asociar jefes
    for (let jefeData of jefes) {
      const contrato = await trabajador_contrato.findOne({
        where: { trabajador_dni: jefeData, estado: "Activo" },
      });

      await suspensiones_jefes.create(
        {
          trabajador_id: contrato.trabajador_dni,
          contrato_id: contrato.contrato_id,
          suspension_id: suspension.id,
        },
        { transaction: t }
      );
    }
    if (tipo === "individual") {
      if (traba_contrato) {
        traba_contrato.estado = "Suspendido";
        await traba_contrato.save({ transaction: t });

        if (traba_contrato.contrato) {
          traba_contrato.contrato.finalizado = true;
          await traba_contrato.contrato.save({ transaction: t });
        }

        if (traba_contrato.evaluacion) {
          traba_contrato.evaluacion.finalizado = true;
          await traba_contrato.evaluacion.save({ transaction: t });
        }
      }
    } else {
      if (traba_contrato) {
        traba_contrato.estado = "Suspendido";
        await traba_contrato.save({ transaction: t });
      }

      await trabajador.update({ asociacion_id: null }, { where: { dni: dni } });
    }

    await t.commit();

    res
      .status(200)
      .json({ msg: "Suspensión registrada con éxito!", status: 200 });
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).send({ msg: "Error interno del servidor", status: 500 });
  }
};

const getHistorialContratoTrabajadores = async (req, res) => {
  try {
    let id = req.params.id;

    const trabajadores = await trabajador_contrato.findAll({
      where: { contrato_id: id },
      include: [
        {
          model: trabajador,
          attributes: [
            "dni",
            "apellido_paterno",
            "apellido_materno",
            "nombre",
            "fecha_nacimiento",
            "telefono",
          ],
        },
        {
          model: evaluacion,
          attributes: ["recomendado_por"],
        },
      ],
    });

    const formatData = trabajadores.map((item) => {
      return {
        nombre:
          item?.trabajador?.apellido_paterno +
          " " +
          item?.trabajador?.apellido_materno +
          " " +
          item?.trabajador?.nombre,
        dni: item?.trabajador?.dni,
        fecha_nacimiento: dayjs(item?.trabajador?.fecha_nacimiento).format(
          "DD-MM-YYYY"
        ),
        telefono: item?.trabajador?.telefono,
        recomendado_por: item?.evaluacion?.recomendado_por,
      };
    });
    res.status(200).json({ data: formatData, status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      msg: "No se pudo obtener la lista de trabajadores.",
    });
  }
};

const estadisticasContrato = async (req, res) => {
  try {
    const { count, rows } = await trabajador_contrato.findAndCountAll({
      where: { estado: "Activo", contrato_id: { [Op.not]: null } },
      include: [
        {
          model: contrato,
          attributes: [
            "id",
            "fecha_inicio",
            "tipo_contrato",
            "fecha_fin_estimada",
            "fecha_fin",
            "volquete",
            "teletran",
            "area_id",
            "asociacion_id",
          ],
          include: [
            { model: campamento, attributes: ["id", "nombre"] },
            { model: area, attributes: ["id", "nombre"] },
            { model: teletrans },
          ],
        },
      ],
    });
    const groupedData = rows.reduce(
      (acc, curr) => {
        const areaId = curr?.contrato?.area?.id || "Sin_ID_Area";
        const areaName = curr?.contrato?.area?.nombre || "Sin Área";
        const campamentoId =
          curr?.contrato?.campamento?.id || "Sin_ID_Campamento";
        const campamentoName =
          curr?.contrato?.campamento?.nombre || "Sin Campamento";

        let area = acc.formattedAreas.children.find(
          (child) => child.id === areaId
        );
        if (!area) {
          // Si no, agregar una nueva entrada para el área
          area = { id: areaId, name: areaName, value: 0 };
          acc.formattedAreas.children.push(area);
        }

        // Incrementar el contador de trabajadores para el área
        area.value++;

        // Acumula la cuenta de trabajadores por área
        if (!acc.areas[areaId]) {
          acc.areas[areaId] = { count: 1, name: areaName };
        } else {
          acc.areas[areaId].count++;
        }

        // Acumula la cuenta de trabajadores por campamento
        if (!acc.campamentos[campamentoId]) {
          acc.campamentos[campamentoId] = { count: 1, name: campamentoName };
        } else {
          acc.campamentos[campamentoId].count++;
        }
        const tipoContrato = curr?.contrato?.tipo_contrato || "Sin Tipo";

        // Acumula la cuenta de trabajadores por tipo de contrato
        if (!acc.tipoContrato[tipoContrato]) {
          acc.tipoContrato[tipoContrato] = 1;
        } else {
          acc.tipoContrato[tipoContrato]++;
        }

        const contratoId = curr?.contrato?.id;
        const teletransTotal =
          parseFloat(curr?.contrato?.teletrans[0]?.total) || 0;

        // Verificar si el contrato actual ya fue procesado
        if (!acc.contratosProcesados.includes(contratoId)) {
          acc.totalPagoTeletrans += teletransTotal;
          acc.contratosProcesados.push(contratoId); // Marcar el contrato como procesado
        }

        if (curr?.contrato?.asociacion_id) {
          acc.trabajadoresAsociacion++;
        } else {
          acc.trabajadoresIndividuales++;
        }
        return acc;
      },
      {
        areas: {},
        campamentos: {},
        totalPagoTeletrans: 0,
        tipoContrato: {},
        contratosProcesados: [],
        formattedAreas: { name: "root", children: [] },
        trabajadoresAsociacion: 0,
        trabajadoresIndividuales: 0,
      }
    );

    const areaLabels = Object.values(groupedData.areas).map(
      (area) => area.name
    );
    const areaData = Object.values(groupedData.areas).map((area) => area.count);

    // Transformar la data agrupada para campamentos
    const campamentoLabels = Object.values(groupedData.campamentos).map(
      (campamento) => campamento.name
    );
    const campamentoData = Object.values(groupedData.campamentos).map(
      (campamento) => campamento.count
    );

    const areaChartData = {
      labels: areaLabels,
      datasets: [
        {
          label: "Trabajadores",
          data: areaData,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };

    const campamentoChartData = {
      labels: campamentoLabels,
      datasets: [
        {
          label: "Trabajadores",
          data: campamentoData,
          backgroundColor: [
            "rgba(255, 0, 0, 0.2)", // Rojo
            "rgba(0, 255, 0, 0.2)", // Verde
            "rgba(0, 109, 255, 0.2)", // Azul
            "rgba(255, 255, 0, 0.2)", // Amarillo
            "rgba(135, 0, 255, 0.2)", // Magenta
            "rgba(0, 255, 255, 0.2)", // Cian
            "rgba(128, 0, 128, 0.2)", // Púrpura
            "rgba(255, 165, 0, 0.2)", // Naranja
          ],
          borderColor: [
            "rgba(255, 0, 0, 1)", // Rojo
            "rgba(0, 255, 0, 1)", // Verde
            "rgba(0, 109, 255, 1)", // Azul
            "rgba(255, 255, 0, 1)", // Amarillo
            "rgba(135, 0, 255, 1)", // Magenta
            "rgba(0, 255, 255, 1)", // Cian
            "rgba(128, 0, 128, 1)", // Púrpura
            "rgba(255, 165, 0, 1)", // Naranja
          ],

          borderWidth: 1,
        },
      ],
    };
    const tipoContratoLabels = Object.keys(groupedData.tipoContrato);
    const tipoContratoData = Object.values(groupedData.tipoContrato);

    const tipoContratoChartData = {
      labels: tipoContratoLabels,
      datasets: [
        {
          label: "Trabajadores por Tipo de Contrato",
          data: tipoContratoData,
          backgroundColor: [
            "rgba(0, 0, 255, 0.2)", // Azul
            "rgba(255, 255, 0, 0.2)", // Amarillo
            "rgba(128, 0, 128, 0.2)", // Púrpura
          ],
          borderColor: [
            "rgba(0, 0, 255, 1)", // Azul
            "rgba(255, 255, 0, 1)", // Amarillo
            "rgba(128, 0, 128, 1)", // Púrpura
          ],
          borderWidth: 1,
        },
      ],
    };
    const totalPago = groupedData.totalPagoTeletrans;
    const volquetes = Math.floor(totalPago / 4);
    const tele = totalPago % 4;

    const fechaInicio = req.query.fechaInicio;
    const fechaFin = req.query.fechaFin;

    // 1. Llama a estadisticasPorFecha
    const trabajadoresFechaChartData = await estadisticasPorFecha(
      fechaInicio,
      fechaFin
    );

    const prueba = {
      total: count,
      areaChartData,
      treeData: groupedData.formattedAreas,
      campamentoChartData,
      tipoContratoChartData,
      volquetes,
      tele,
      trabajadoresAsociacion: groupedData.trabajadoresAsociacion, // <-- Añadir este
      trabajadoresIndividuales: groupedData.trabajadoresIndividuales,
      trabajadoresFechaChartData: trabajadoresFechaChartData,
    };

    res.status(200).json({ data: prueba });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      msg: "No se pudo obtener las estadísticas.",
    });
  }
};

const estadisticasPorFecha = async (fechaInicio, fechaFin) => {
  try {
    console.log(fechaInicio);
    const trabajadores = await trabajador_contrato.findAll({
      where: { contrato_id: { [Op.not]: null } },
      include: [
        {
          model: contrato,
          attributes: ["id", "fecha_inicio", "fecha_fin", "asociacion_id"],
          where: {
            fecha_inicio: {
              [Op.gte]: fechaInicio
            },
            fecha_fin: {
              [Op.lte]: fechaFin
            }
          },
        },
      ],
    });

    console.log(trabajadores.length);
    let trabajadoresAsociacionPorFecha = 0;
    let trabajadoresIndividualesPorFecha = 0;

    trabajadores.forEach((trabajador) => {
      if (trabajador.contrato.asociacion_id) {
        trabajadoresAsociacionPorFecha++;
      } else {
        trabajadoresIndividualesPorFecha++;
      }
    });

    const labels = ["Asociación", "Individuales"];
    const data = [
      trabajadoresAsociacionPorFecha,
      trabajadoresIndividualesPorFecha,
    ];

    const trabajadoresPorFechaChartData = {
      labels: labels,
      datasets: [
        {
          label: "Trabajadores por fecha",
          data: data,
          backgroundColor: [
            "rgba(75, 192, 192, 0.2)", // Color para Asociación
            "rgba(255, 99, 132, 0.2)", // Color para Individuales
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)", // Color borde para Asociación
            "rgba(255, 99, 132, 1)", // Color borde para Individuales
          ],
          borderWidth: 1,
        },
      ],
    };

    return trabajadoresPorFechaChartData;
  } catch (error) {
    console.log(error);
    throw new Error("Error al obtener las estadísticas por fecha.");
  }
};

module.exports = {
  getContrato,
  updateContrato,
  postContrato,
  deleteContrato,
  getContratoById,
  postContratoAsociacion,
  getContratoAsociacionById,
  getLastId,
  activarContrato,
  getTrabajadorContratoEvaluacion,
  updateAllContratos,
  registrarSuspension,
  getHistorialContratoTrabajadores,
  estadisticasContrato,
};
