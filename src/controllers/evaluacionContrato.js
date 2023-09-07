const {
  contratoEvaluacion,
  contrato,
  evaluacion,
  trabajador,
  campamento,
} = require("../../config/db");

// no se usa en un inicio habia una relacion entre evaluacion y contrato pero ya no existe

const getEvaluacionContrato = async (req, res, next) => {
  try {
    const get = await contratoEvaluacion.findAll({
      include: [
        { model: evaluacion, include: [{ model: trabajador }] },
        { model: contrato, include: [{ model: campamento }] },
      ],
    });
    console.log("getEvaluacionContrato");
    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getContratoById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const get = await contratoEvaluacion.findAll({
      include: [{ model: evaluacion, where: { id: id } }],
    });
    console.log("getContratoById");

    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getContratoEvaluacionById = async (req, res, next) => {
  try {
    const get = await contratoEvaluacion.findAll({
      include: [
        { model: evaluacion, include: [{ model: trabajador }] },
        { model: contrato, include: [{ model: campamento }] },
      ],
    });

    console.log("getEvaluacionContratoByID");

    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

module.exports = {
  getEvaluacionContrato,
  getContratoEvaluacionById,
  getContratoById,
};
