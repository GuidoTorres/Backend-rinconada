const { gerencia, area } = require("../../config/db");

// obtener lista de gerencias
const getGerencia = async (req, res, next) => {
  try {
    const all = await gerencia.findAll({
      attributes: { exclude: ["gerencia_id"] },
    });
    return res.status(200).json({ data: all });
  } catch (error) {
    res.status(500).json();
  }
};

module.exports = { getGerencia };
