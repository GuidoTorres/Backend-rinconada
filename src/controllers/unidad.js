const { unidad } = require("../../config/db");

const getUnidad = async (req, res, next) => {
  try {
    const all = await unidad.findAll();
    return res.status(200).json({ data: all });
    next();
  } catch (error) {
    res.status(500).json();
  }
};

module.exports = { getUnidad };
