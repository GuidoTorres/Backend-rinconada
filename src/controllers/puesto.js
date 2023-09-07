const { rol } = require("../../config/db");

const getPuesto = async (req, res, next) => {
  try {
    const all = await rol.findAll();
    return res.status(200).json({data:all});
    next();
  } catch (error) {
    res.status(500).json();
  }
};


module.exports={getPuesto}