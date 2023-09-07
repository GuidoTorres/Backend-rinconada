const { proveedor } = require("../../config/db");

const getProveedor = async (req, res, next) => {
  try {
    const get = await proveedor.findAll();
    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    res.status(500).json();
  }
};

const getProveedorById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const get = await proveedor.findAll({ where: { id: id } });
    return res.status(200).json({ data: get });

    next();
  } catch (error) {
    res.status(500).json(error);
  }
};

const postProveedor = async (req, res, next) => {
  try {
    const post = await proveedor.create(req.body);
    return res.status(200).json({ msg: "Proveedor creado con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updateProveedor = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await proveedor.update(req.body, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Proveedor actualizado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteProveedor = async (req, res, next) => {
  let id = req.params.id;
  try {
    let destroy = await proveedor.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Proveedor eliminado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  getProveedor,
  getProveedorById,
  postProveedor,
  updateProveedor,
  deleteProveedor,
};
