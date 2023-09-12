const {
  contrato,
  trabajador,
  evaluacion,
  teletrans,
  trabajador_contrato,
  aprobacion_contrato_pago,
  contrato_pago,
  sequelize,
} = require("../../config/db");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

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

          const dataContrato={
            contrato_id: data.contrato_id,
            fecha_inicio: dayjs(data.contrato?.fecha_inicio)?.format("YYYY-MM-DD"),
            codigo_contrato: data.contrato?.codigo_contrato,
            tipo_contrato: data.contrato?.tipo_contrato,
            recomendado_por: data.contrato?.recomendado_por,
            cooperativa: data.contrato?.cooperativa,
            condicion_cooperativa: data.contrato?.condicion_cooperativa,
            periodo_trabajo: data.contrato?.periodo_trabajo,
            fecha_fin: dayjs(data.contrato?.fecha_fin)?.format("YYYY-MM-DD"),
            fecha_fin_estimada: dayjs(data.contrato?.fecha_fin)?.format("YYYY-MM-DD"),
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
            suspendido: data?.contrato?.suspendido
          }

         return{
          contrato: dataContrato,
          evaluacion: data?.evaluacion
         }
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
    if (!req.body.trabajador_id) {
      return res.status(500).json({
        msg: "No se pudo crear el contrato, el trabajador_id es requerido.",
        status: 500,
      });
    }

    const getEva = await evaluacion.findAll({
      where: { trabajador_id: req.body.trabajador_id },
      attributes: { exclude: ["contrato_id"] },
    });

    const filterEva = getEva.filter((item) => item.finalizado === false);

    if (filterEva.length === 0) {
      return res.status(500).json({
        msg: "No se pudo registrar, el trabajador no tiene una evaluación activa.",
        status: 500,
      });
    }

    const obj = { ...req.body, fecha_fin_estimada: req.body.fecha_fin };
    const post = await contrato.create(obj);
    const getTrabaContrato = await trabajador_contrato.findOne({
      where: {
        trabajador_dni: req.body.trabajador_id,
        contrato_id: null,
      },
    });

    // Si se encuentra el registro, actualizarlo con el id del contrato
    if (getTrabaContrato) {
      getTrabaContrato.contrato_id = post.id;
      await getTrabaContrato.save();
    }

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
  try {
    const transaction = await sequelize.transaction();

    if (req.body.trabajadores.length > 0) {
      // Crear contrato con transacción
      const post = await contrato.create(info, { transaction });
      const contraPago = req?.body?.trabajadores?.map((item) => {
        return {
          trabajador_dni: item,
          contrato_id: post.id,
        };
      });

      // Crear trabajador_contrato con transacción
      const createContraPago = await trabajador_contrato.bulkCreate(
        contraPago,
        {
          ignoreDuplicates: false,
          transaction, // incluir la transacción aquí
        }
      );
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
    if (transaction) await transaction.rollback(); // Revocar la transacción si se produjo un error
    res.status(500).json({ msg: "No se pudo crear el contrato.", status: 500 });
  }
};

//actualizar el contrato
const updateContrato = async (req, res, next) => {
  let id = req.params.id;
  console.log(req.body);
  try {
    let info = {
      ...req.body,
      fecha_fin_estimada: req.body.fecha_fin,
    };
    delete info.contrato_id

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
    let removeTtrans = await teletrans.destroy({ where: { contrato_id: id } });
    let contra_pago = await contrato_pago.destroy({
      where: { contrato_id: id },
    });

    let aproba = await aprobacion_contrato_pago.destroy({
      where: { contrato_id: id },
    });
    let removeTrabajadorContrato = await trabajador_contrato.destroy({
      where: { contrato_id: id },
    });
    let remove = await contrato.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Contrato eliminado con éxito!", status: 200 });
  } catch (error) {
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
};
