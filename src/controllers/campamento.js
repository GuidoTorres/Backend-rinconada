const { campamento } = require("../../config/db");


// obtener lista de campamentos
const getCampamento = async (req, res, next) => {
  try {
    const all = await campamento.findAll({attributes: { exclude: ["campamento_id"] },});
    return res.status(200).json({ data: all });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};
// obtener lista de campamentos por id

const getCampamentoById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const camp = await campamento.findAll({ where: { id: id } });
    return res.status(200).json({ data: camp });

  } catch (error) {
    res.status(500).json(error);
  }
};
// crear campamento
const postCampamento = async (req, res, next) => {
  let info = {
    nombre: req.body.nombre,
    direccion: req.body.direccion,
  };
  try {
    await campamento.create(info);
    return res.status(200).json({ msg:"Campamento creado con éxito!", status: 200});

  } catch (error) {
    res.status(500).json({ msg:"No se pudo crear.", status: 500});
  }
};

// actualizar campamento
const updateCampamento = async (req, res, next) => {
  let id = req.params.id;

  try {
    await campamento.update(req.body, { where: { id: id } });
    return res.status(200).json({ msg: "Campamento actualizado con éxito", status:200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status:500 });
  }
};

// eliminar campamento
const deleteCampamento = async (req, res, next) => {
  let id = req.params.id;
  try {
    await campamento.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Campamento eliminado con éxito!", status:200 });
    
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status:500 });
  }
};

module.exports = {
  getCampamento,
  getCampamentoById,
  postCampamento,
  updateCampamento,
  deleteCampamento,
};
