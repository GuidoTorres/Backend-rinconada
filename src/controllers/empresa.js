const { empresa, contrato } = require("../../config/db");

// para crear empresa pero en realidad no se usa, ya que no existen mas empresas que cecomirl

const getEmpresa = async (req, res, next) => {
  try {
    const all = await empresa.findAll({
      include: [{ model: contrato, attributes: { exclude: ["contrato_id"] } }],
    });

    const formatData = all.map(item => {

      return{
        id: item?.id,
        razon_social: item?.razon_social,
        ruc: item?.ruc,
        contrato_id: item?.contratos?.at(-1)?.id,

      }
    })
    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getEmpresaById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const all = await empresa.findAll({
      where: { id: id },
      include: [{ model: contrato, attributes: { exclude: ["contrato_id"] } }],
    });
    const filterContrato = all?.filter((item) => item.contratos.length !== 0);
    return res.status(200).json({ data: filterContrato });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};

const postEmpresa = async (req, res, next) => {
  let info = {
    razon_social: req.body.razon_social,
    ruc: req.body.ruc,
  };

  try {
    const getRuc = await empresa.findAll({
      where: { ruc: info.ruc },
    });

    if (getRuc.length > 0) {
      return res.status(409).json({
        msg: "Ruc actualmente registrado, intente con otro!",
        status: 409,
      });
    } else {
      const empre = await empresa.create(info);
      return res
        .status(200)
        .json({ msg: "Empresa registrada correctamente!", status: 200 });
    }

  } catch (error) {
    res.status(500).json({ msg: "Eliminada con éxito!", status: 500 });
  }
};

const updateEmpresa = async (req, res, next) => {
  let id = req.params.id;

  try {
    let camp = await empresa.update(req.body, { where: { id: id } });
    return res.status(200).json({ msg: "Empresa actualizada con éxito", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deleteEmpresa = async (req, res, next) => {
  let id = req.params.id;
  try {
    let camp = await empresa.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Empresa eliminada con éxito!", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

module.exports = {
  getEmpresa,
  postEmpresa,
  updateEmpresa,
  deleteEmpresa,
  getEmpresaById,
};
