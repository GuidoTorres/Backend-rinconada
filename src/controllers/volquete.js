const { volquete } = require("../../config/db");

const getVolquete = async (req, res, next) => {
  try {
    const all = await volquete.findAll();
    return res.status(200).json({ data: all });
    next();
  } catch (error) {
    res.status(500).json();
  }
};

const getVolqueteById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const get = await volquete.findAll({ where: { id: id } });
    return res.status(200).json({ data: get });

    next();
  } catch (error) {
    res.status(500).json(error);
  }
};

const postVolquete = async (req, res, next) => {
  try {
    const camp = await volquete.create(req.body);
    return res.status(200).json({ msg: "Trapiche creado con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updateVolquete = async (req, res, next) => {
  let id = req.params.id;

  try {
    let camp = await volquete.update(req.body, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Trapiche actualizado con éxito", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteVolquete = async (req, res, next) => {
  let id = req.params.id;
  try {
    let camp = await volquete.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Trapiche eliminado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  getVolquete,
  getVolqueteById, postVolquete, updateVolquete, deleteVolquete
};
