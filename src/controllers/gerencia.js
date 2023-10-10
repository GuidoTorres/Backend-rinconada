const { gerencia, area, cargo } = require("../../config/db");

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

const getGerenciaAreaCargo = async (req, res) => {
  try {
    const all = await gerencia.findAll({
      attributes: ["nombre"],
      include: [
        {
          model: area,
          attributes: ["nombre"],
          include: [{ model: cargo, attributes: ["nombre"] }],
        },
      ],
    });
    const formatData = {
      name: "Gerencia - Área - Cargo", // el nombre del nodo raíz
      children: all.map((item) => {
        return {
          name: item.nombre,
          value: 1,
          children: item.areas.map((data) => {
            return {
              name: data.nombre,
              value: 1,
              children: data.cargos.map((dat) => {
                return {
                  name: dat.nombre,
                  value: 1,
                };
              }),
            };
          }),
        };
      }),
    };

    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

module.exports = { getGerencia, getGerenciaAreaCargo };
