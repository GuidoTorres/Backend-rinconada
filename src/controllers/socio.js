const { socio } = require("../../config/db");

const getSocio = async (req, res, next) => {
  try {
    const all = await socio.findAll();
    return res.status(200).json({ data: all });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const postSocio = async (req, res, next) => {
  let info = {
    nombre: req.body.nombre,
    dni: req.body.dni,
    telefono: req.body.telefono,
    cooperativa: req.body.cooperativa,
  };

  try {
    const getSocio = await socio.findAll({
      raw: true,
    });
    const filterRepeated = getSocio.filter((item) => item.dni == info.dni);
    if (filterRepeated.length > 0) {
      return res.status(200).json({ msg: "El socio ya esta registrado.", status: 403 });
    } else {
      const create = await socio.create(info);
      return res.status(200).json({ msg: "Socio creado con éxito!", status: 200 });
    }
  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo registrar al socio.", status: 500 });
  }
};

const updateSocio = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await socio.update(req.body, { where: { id: id } });
    return res.status(200).json({ msg: "Socio actualizado con éxito!", status:200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar el registro.",status:500 });
  }
};

const deleteSocio = async (req, res, next) => {
  let id = req.params.id;
  try {
    let delRol = await socio.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Eliminado con éxito!", status:200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar el registro.", status:500 });
  }
};

module.exports = { getSocio, postSocio, updateSocio, deleteSocio };
