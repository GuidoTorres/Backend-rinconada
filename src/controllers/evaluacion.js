const {
  evaluacion,
  trabajador,
  contrato,
  contratoEvaluacion,
  trabajador_contrato,
  sequelize,
} = require("../../config/db");
const dayjs = require("dayjs");
const { Op } = require("sequelize");

// obtener lista de evaluaciones
const getEvaluacion = async (req, res, next) => {
  try {
    const get = await evaluacion.findAll();
    return res.status(200).json({ data: get });
  } catch (error) {
    res.status(500).json();
  }
};

// lsita de evaluaciones por id de evaluacion
const getEvaluacionById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const evaluaciones = await trabajador_contrato.findAll({
      where: { trabajador_dni: id },
      order: [["id", "ASC"]],
      include: [
        {
          model: trabajador,
          attributes: ["nombre", "apellido_materno", "apellido_paterno"],
        },
        {
          model: contrato,
          attributes: ["suspendido", "nota_contrato"],
        },
        { model: evaluacion },
      ],
    });
    const obj = evaluaciones.map((item, index) => {
      return {
        evaluacion_id: item?.evaluacion_id,
        trabajador_id: item?.trabajador_dni,
        fecha_evaluacion_tabla: dayjs(
          item?.evaluacion?.fecha_evaluacion
        ).format("DD-MM-YYYY"),
        fecha_evaluacion: dayjs(item?.evaluacion?.fecha_evaluacion),
        evaluacion_laboral: item?.evaluacion?.evaluacion_laboral,
        finalizado: item?.evaluacion?.finalizado,
        antecedentes: item?.evaluacion?.antecedentes,
        capacitacion_gema: item?.evaluacion?.capacitacion_gema,
        capacitacion_sso: item?.evaluacion?.capacitacion_sso,
        gerencia_id: item?.evaluacion?.gerencia_id,
        area_id: item?.evaluacion?.area_id,
        puesto_id: item?.evaluacion?.puesto_id,
        campamento_id: item?.evaluacion?.campamento_id,
        diabetes: item?.evaluacion?.diabetes,
        emo: item?.evaluacion?.emo,
        imc: item?.evaluacion?.imc,
        presion_arterial: item?.evaluacion?.presion_arterial,
        pulso: item?.evaluacion?.pulso,
        saturacion: item?.evaluacion?.saturacion,
        temperatura: item?.evaluacion?.temperatura,
        aprobado: item?.evaluacion?.aprobado,
        recomendado_por: item?.evaluacion?.recomendado_por,
        cooperativa: item?.evaluacion?.cooperativa,
        condicion_cooperativa: item?.evaluacion?.condicion_cooperativa,
        nombre:
          item?.trabajador?.nombre +
          " " +
          item?.trabajador?.apellido_paterno +
          " " +
          item?.trabajador?.apellido_materno,
        control: item?.evaluacion?.control,
        topico: item?.evaluacion?.topico,
        seguridad: item?.evaluacion?.seguridad,
        medio_ambiente: item?.evaluacion?.medio_ambiente,
        fiscalizador: item?.evaluacion?.fiscalizador,
        fiscalizador_aprobado: item?.evaluacion?.fiscalizador_aprobado,
        topico_observacion: item?.evaluacion?.topico_observacion,
        control_observacion: item?.evaluacion?.control_observacion,
        seguridad_observacion: item?.evaluacion?.seguridad_observacion,
        medio_ambiente_observacion:
          item?.evaluacion?.medio_ambiente_observacion,
        recursos_humanos: item?.evaluacion?.recursos_humanos,
        recursos_humanos_observacion:
          item?.evaluacion?.recursos_humanos_observacion,
        suspendido: item?.contrato?.suspendido
          ? item?.contrato?.suspendido.toString()
          : null,
        nota_contrato: item?.contrato?.nota_contrato
          ? item?.contrato?.nota_contrato
          : null,
      };
    });
    return res.status(200).json({ data: obj });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

// crear evaluacion
const postEvaluacion = async (req, res, next) => {
  let info = {
    fecha_evaluacion: req?.body?.fecha_evaluacion,
    capacitacion_sso: req?.body?.capacitacion_sso,
    capacitacion_gema: req?.body?.capacitacion_gema,
    evaluacion_laboral: req?.body?.evaluacion_laboral,
    presion_arterial: req?.body?.presion_arterial,
    temperatura: req?.body?.temperatura,
    saturacion: req?.body?.saturacion,
    imc: req?.body?.imc,
    pulso: req?.body?.pulso,
    diabetes: req?.body?.diabetes,
    antecedentes: req?.body?.antecedentes,
    emo: req?.body?.emo,
    trabajador_id: req?.body?.trabajador_id,
    aprobado: req?.body?.aprobado,
    control: req?.body?.control,
    topico: req?.body?.topico,
    seguridad: req?.body?.seguridad,
    medio_ambiente: req?.body?.medio_ambiente,
    recomendado_por: req?.body?.recomendado_por,
    cooperativa: req?.body?.cooperativa,
    condicion_cooperativa: req?.body?.condicion_cooperativa,
    fiscalizador: req?.body?.fiscalizador,
    fiscalizador_aprobado: req?.body?.fiscalizador_aprobado,
    topico_observacion: req?.body?.topico_observacion,
    control_observacion: req?.body?.control_observacion,
    seguridad_observacion: req?.body?.seguridad_observacion,
    medio_ambiente_observacion: req?.body?.medio_ambiente_observacion,
    recursos_humanos: req?.body?.recursos_humanos,
    recursos_humanos_observacion: req?.body?.recursos_humanos_observacion,
    finalizado: req?.body?.finalizado,
    gerencia_id: req?.body?.gerencia_id || null,
    area_id: req?.body?.area_id || null,
    puesto_id: req?.body?.puesto_id || null,
    campamento_id: req?.body?.campamento_id || null,
  };

  const t = await sequelize.transaction();
  try {
    const get = await evaluacion.findAll({
      where: { trabajador_id: info.trabajador_id },
    });
    const filter = get.filter((item) => item.finalizado === false);

    const { fecha_evaluacion } = req.body;

    if (fecha_evaluacion === "") {
      return res.status(500).json({
        msg: "Ingrese una fecha para registrar la evaluación.",
        status: 500,
      });
    }

    if (filter.length > 0) {
      return res.status(500).json({
        msg: "No se pudo crear la evaluación, el trabajador tiene una evaluación activa.",
        status: 500,
      });
    }

    const post = await evaluacion.create(info, { transaction: t });

    await trabajador_contrato.create(
      {
        trabajador_dni: info.trabajador_id,
        evaluacion_id: post.id,
      },
      { transaction: t }
    );
    await t.commit();

    return res
      .status(200)
      .json({ msg: "Evaluación creada con éxito!", status: 200 });
  } catch (error) {
    console.log('====================================');
    console.log(error);
    console.log('====================================');
    await t.rollback();
    res
      .status(500)
      .json({ msg: "No se pudo crear la evaluación.", status: 500 });
  }
};

const updateEvaluacion = async (req, res, next) => {
  let id = req.params.id;

  try {
    console.log(req.body);
    const put = await evaluacion.update(req.body, {
      where: { id: id },
    });
    return res
      .status(200)
      .json({ msg: "Evaluación actualizada con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: error, status: 500 });
  }
};

const deleteEvaluacion = async (req, res, next) => {
  let id = req.params.id;
  try {
    await trabajador_contrato.destroy({ where: { evaluacion_id: id } });
    await evaluacion.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Evaluación eliminada con éxito!", status: 200 });
  } catch (error) {
    console.log("====================================");
    console.log(error);
    console.log("====================================");
    res
      .status(500)
      .json({ msg: "No se pudo eliminar la evaluación.", status: 500 });
  }
};
const activarEvaluacion = async (req, res) => {
  let id = req.params.id;
  try {
    const evaluacionActual = await evaluacion.findOne({
      where: { id: id },
    });

    if (!evaluacionActual) {
      return res.status(404).json({ msg: "No se encontró la evaluación." });
    }

    const nuevoEstado = !evaluacionActual.finalizado;

    await evaluacion.update({ finalizado: nuevoEstado }, { where: { id: id } });

    return res.status(200).json({
      msg: `Se ${
        nuevoEstado === true ? "finalizó" : "activó"
      } la evaluación con éxito!`,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "No se pudo cambiar el estado de la evaluación",
      status: 500,
    });
  }
};

module.exports = {
  getEvaluacion,
  postEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  getEvaluacionById,
  activarEvaluacion,
};