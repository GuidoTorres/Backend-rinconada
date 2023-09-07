const { trapiche } = require("../../config/db");

const getTrapiche = async (req, res, next) => {
  try {
    const all = await trapiche.findAll();
    return res.status(200).json({ data: all });
    next();
  } catch (error) {
    res.status(500).json();
  }
};

const getTrapicheById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const get = await trapiche.findAll({ where: { id: id } });
    return res.status(200).json({ data: get });

    next();
  } catch (error) {
    res.status(500).json(error);
  }
};

const postTrapiche = async (req, res, next) => {
  try {
    const camp = await trapiche.create(req.body);
    return res.status(200).json({ msg: "Trapiche creado con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updateTrapiche = async (req, res, next) => {
  let id = req.params.id;

  try {
    let camp = await trapiche.update(req.body, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Trapiche actualizado con éxito", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteTrapiche = async (req, res, next) => {
  let id = req.params.id;
  try {
    let camp = await trapiche.destroy({ where: { id: id } });
    res.status(200).json({ msg: "Trapiche eliminado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  getTrapiche,
  getTrapicheById,
  postTrapiche,
  updateTrapiche,
  deleteTrapiche,
};
