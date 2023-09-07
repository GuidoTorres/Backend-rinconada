const { area, gerencia, cargo } = require("../../config/db");

const getArea = async (req, res, next) => {
  try {
    const all = await area.findAll({
      attributes: { exclude: ["area_id"] },
      include: [{ model: gerencia, attributes: { exclude: ["gerencia_id"] } }],
    });
    return res.status(200).json({ data: all });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};
const getPrueba = async (req, res, next) => {
  try {
    const all = await gerencia.findAll({
      include: [
        {
          model: area,
          include: [{ model: cargo, attributes: { exclude: ["cargo_id"] } }],
        },
      ],
    });
    return res.status(200).json({ data: all });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

module.exports = { getArea, getPrueba };
