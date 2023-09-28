const {
  almacen,
  incidentes,
  trabajador_contrato,
  contrato,
  trabajador,
  area,
} = require("../../config/db");

const getIncidentes = async (req, res, next) => {
  try {
    const get = await incidentes.findAll({
      include: [
        {
          model: trabajador_contrato,
          include: [
            {
              model: trabajador,

              attributes: [
                "dni",
                "apellido_paterno",
                "apellido_materno",
                "nombre",
              ],
            },
            {
              model: contrato,
              attributes: ["area_id"],
              include: [{ model: area }],
            },
          ],
        },
      ],
    });

    const formatData = get.map((item) => {
      return {
        id: item?.id,
        fecha: item?.fecha,
        hora: item?.hora,
        nivel: item?.nivel,
        evento: item?.evento,
        tipo: item?.tipo,
        ubicacion: item?.ubicacion,
        labor: item?.labor,
        lugar: item?.lugar,
        descripcion: item?.descripcion,
        tajo: item?.tajo,
        area_involucrada: item?.area_involucrada,
        medida_correctiva: item?.medida_correctiva,
        foto: item?.foto,
        trabajador_contrato_id: item?.trabajador_contrato_id,
        reportado_por:
          item?.trabajador_contrato?.trabajador?.apellido_paterno +
          " " +
          item?.trabajador_contrato?.trabajador?.apellido_materno +
          " " +
          item?.trabajador_contrato?.trabajador?.nombre,
        area: item?.trabajador_contrato?.contrato?.area?.nombre,
        altura: item?.altura
      };
    });

    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getIncidenteById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const getById = await incidentes.findAll({
      where: { id: id },
    });
    return res.status(200).json({ data: getById });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

const postIncidentes = async (req, res, next) => {
  try {
    info = {
      ...req.body,
    };
    info.foto = req.file ? process.env.LOCAL_IMAGE + req?.file?.filename : "";
    await incidentes.create(info);
    return res
      .status(200)
      .json({ msg: "Incidente registrado con éxito!", status: 200 });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "No se pudo registrar el incidente.", status: 500 });
  }
};

const updateIncidentes = async (req, res, next) => {
  let id = req.params.id;
  try {
    await incidentes.update(req.body, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Incidente actualizado con éxito!", status: 200 });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo actualizar el incidente.", status: 500 });
  }
};

const deleteIncidente = async (req, res, next) => {
  let id = req.params.id;
  try {
    await incidentes.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Incidente eliminado con éxito!", status: 200 });
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

const getTrabajadorContrato = async (req, res) => {
  try {
    const trabajadores = await trabajador_contrato.findAll({
      where: { estado: "Activo" },
      attributes: ["id"],
      include: [
        {
          model: contrato,
          attributes: ["id", "area_id"],
          include: [{ model: area }],
        },
        {
          model: trabajador,
          attributes: ["dni", "apellido_materno", "apellido_paterno", "nombre"],
        },
      ],
    });

    const formatData = trabajadores.map((item) => {
      return {
        trabajador_contrato_id: item?.id,
        area: item?.contrato?.area?.nombre,
        dni: item?.trabajador?.dni,
        nombre:
          item?.trabajador?.apellido_paterno +
          " " +
          item?.trabajador?.apellido_materno +
          " " +
          item?.trabajador?.nombre,
      };
    });
    return res.status(200).json({ data: formatData, status: 200 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo obtener la data.", status: 500 });
  }
};

module.exports = {
  getIncidentes,
  getIncidenteById,
  postIncidentes,
  updateIncidentes,
  deleteIncidente,
  getTrabajadorContrato,
};
