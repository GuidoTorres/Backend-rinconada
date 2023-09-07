const { where } = require("sequelize");
const { sucursal, saldo, ingresos_egresos } = require("../../config/db");

const getsucursal = async (req, res, next) => {
  try {
    const get = await sucursal.findAll();
    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    res.status(500).json();
  }
};

const getSucursalById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const get = await sucursal.findAll({ where: { id: id } });
    return res.status(200).json({ data: get });

    next();
  } catch (error) {
    res.status(500).json(error);
  }
};

const postSucursal = async (req, res, next) => {
  try {
    const post = await sucursal.create(req.body);
    let info = {
      sucursal_id: post.id,
      saldo_inicial: parseInt(req.body.saldo_inicial),
      ingresos: 0,
      egresos: 0,
      saldo_final: parseInt(req.body.saldo_inicial)
    };
    const postSaldo = await saldo.create(info);
    return res.status(200).json({ msg: "Sucursal creada con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear la sucursal.", status: 500 });
  }
};

const updateSucursal = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await sucursal.update(req.body, { where: { id: id } });
    let info = {
      saldo_inicial: parseFloat(req.body.saldo_inicial).toFixed(2),
    };
    let updateSaldo = await saldo.update(info, { where: { sucursal_id: id } });
    return res
      .status(200)
      .json({ msg: "Sucursal actualizada con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteSucursal = async (req, res, next) => {
  let id = req.params.id;
  try {

    let destroyIngresos = await ingresos_egresos.destroy({where: {sucursal_id: id}})
    let destroySaldo = await saldo.destroy({
      where: {sucursal_id: id}
    })
    let destroy = await sucursal.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Sucursal eliminada con éxito!", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  getsucursal,
  getSucursalById,
  postSucursal,
  updateSucursal,
  deleteSucursal,
};
