const { cargo, area } = require("../../config/db");


// obtener la lista de cargos o puestos de trabajadores
const getCargo = async (req, res, next) => {
  try {
    const all = await cargo.findAll({
      include: [{ model: area, attributes: { exclude: ["area_id"] } }],
      attributes: { exclude: ["cargo_id", "puesto_id"] },
    });
    return res.status(200).json({ data: all });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};


module.exports = { getCargo };
