const { categoria } = require("../../config/db");

const getCategoria = async (req, res, next) => {
  try {
    const get = await categoria.findAll();
    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    res.status(500).json();
  }
};

const postCategoria = async (req, res, next) => {
  try {
    const post = await categoria.create(req.body);
    return res.status(200).json({ msg: "Categoría creada con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({msg: "No se pudo crear.", status: 500});
  }
};

const updateCategoria = async (req, res, next) => {
  let id = req.params.id;

  try {
    let camp = await categoria.update(req.body, { where: { id: id } });
    return res.status(200).json({ msg: "Categoría actualizada con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({msg: "No se pudo actualizar.", status:500});
  }
};

const deleteCategoria = async (req, res, next) => {
  let id = req.params.id;
  try {
    let camp = await categoria.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Categoría eliminada con éxito!", status:200 });
    next();
  } catch (error) {
    res.status(500).json({msg: "No se pudo eliminar.", status:500});
  }
};

module.exports = { getCategoria, postCategoria, updateCategoria, deleteCategoria };
