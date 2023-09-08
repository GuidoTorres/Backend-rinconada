const {
  asociacion,
  trabajador,
  contrato,
  evaluacion,
  campamento,
  area,
  cargo,
  trabajador_contrato,
} = require("../../config/db");

const XLSX = require("xlsx");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const moment = require("moment");
require("moment/locale/es");
// Cargar idioma en español
const es = require("dayjs/locale/es");
dayjs.locale(es);

//  obtener la lista de asociaciones con trabajador
const getAsociacion = async (req, res, next) => {
  try {
    const all = await asociacion.findAll({
      include: [
        {
          model: contrato,
          attributes: { exclude: ["contrato_id", "campamento_id"] },
          include: [
            { model: campamento, attributes: { exclude: ["campamento_id"] } },
          ],
        },
        {
          model: trabajador,
          attributes: { exclude: ["usuarioId"] },
          include: [
            {
              model: trabajador_contrato,
              include: [
                {
                  model: contrato,
                  attributes: { exclude: ["contrato_id"] },
                  where: { finalizado: { [Op.not]: true } },
                },
                {
                  model: evaluacion,
                  where: { finalizado: { [Op.not]: true } },
                },
              ],
            },
          ],
        },
      ],
    });

    const formatData = all.map((item) => {
      const trabajadors = item.trabajadors
        .map((data, i) => {
          const contratoActivo = item?.contratos[0]
          return {
            dni: data.dni,
            codigo_trabajador: data.codigo_trabajador,
            campamento: contratoActivo?.campamento?.nombre,
            fecha_nacimiento: data.fecha_nacimiento,
            telefono: data.telefono,
            nombre: data.nombre,
            apellido_paterno: data.apellido_paterno,
            apellido_materno: data.apellido_materno,
            email: data.email,
            estado_civil: data.estado_civil,
            genero: data.genero,
            direccion: data.direccion,
            asociacion_id: data.asociacion_id,
            deshabilitado: data.deshabilitado,
            foto: data.foto,
            eliminar: data.eliminar,
            evaluacions: data?.trabajador_contratos[0]?.evaluacion,
          };
        })
        .sort((a, b) =>
          a.codigo_trabajador.localeCompare(b.codigo_trabajador)
        );

      // Aquí es donde se agrega el campo 'nro'
      const trabajadorsWithNro = trabajadors.map((trabajador, index) => ({
        ...trabajador,
        nro: index + 1,
      }));
      const contratoActivo = item?.contratos?.filter(
        (ele) => ele.finalizado === false
      );
      return {
        id: item?.id,
        nombre: item?.nombre,
        codigo: item?.codigo,
        tipo: item?.tipo,
        campamento: contratoActivo[0]?.campamento?.nombre,
        contrato: contratoActivo
          .map((data) => {
            return {
              id: data.id,
              area: data.area,
              asociacion_id: data.asociacion_id,
              base: data.base,
              campamento: data.campamento.nombre,
              codigo_contrato: data.codigo_contrato,
              condicion_cooperativa: data.condicion_cooperativa,
              cooperativa: data.cooperativa,
              empresa_id: data.empresa_id,
              fecha_fin: dayjs(data.fecha_fin).format("YYYY-MM-DD"),
              fecha_inicio: dayjs(data.fecha_inicio).format("YYYY-MM-DD"),
              gerencia: data.gerencia,
              id: data.id,
              jefe_directo: data.jefe_directo,
              nota_contrato: data.nota_contrato,
              periodo_trabajo: data.periodo_trabajo,
              puesto: data.puesto,
              recomendado_por: data.recomendado_por,
              termino_contrato: data.termino_contrato,
              tipo_contrato: data.tipo_contrato,
              finalizado: data.finalizado,
            };
          })
          .filter((item) => item.finalizado === false),
        trabajadors: trabajadorsWithNro,
      };
    });

    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

//  obtener la lista de asociacion con trabajador por id
const getAsociacionById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const all = await asociacion.findAll({
      where: { id: id },

      include: [
        { model: contrato, attributes: { exclude: ["contrato_id"] } },
        {
          model: trabajador,
          attributes: { exclude: ["usuarioId"] },
          include: [{ model: evaluacion }],
        },
      ],
    });

    const obj = all.map((item) => {
      return {
        id: item.id,
        nombre: item.nombre,
        codigo: item.nombre,
        tipo: item.tipo,
        contrato: item.contratos
          .filter((data) => data.finalizado === false)
          .map((item) => {
            return {
              id: item.id,
              gerencia_id: item.gerencia_id,
              area_id: item.area_id,
              campamento_id: item.campamento_id,
              asociacion_id: item.asociacion_id,
              base: item.base,
              codigo_contrato: item.codigo_contrato,
              condicion_cooperativa: item.condicion_cooperativa,
              cooperativa: item.cooperativa,
              empresa_id: item.empresa_id,
              fecha_fin: dayjs(item.fecha_fin).format("YYYY-MM-DD"),
              fecha_inicio: dayjs(item.fecha_inicio).format("YYYY-MM-DD"),
              id: item.id,
              jefe_directo: item.jefe_directo,
              nota_contrato: item.nota_contrato,
              periodo_trabajo: item.periodo_trabajo,
              puesto: item.puesto,
              recomendado_por: item.recomendado_por,
              termino_contrato: item.termino_contrato,
              tipo_contrato: item.tipo_contrato,
              tareo: item.tareo,
            };
          }),
        trabajador: item.trabajadors,
      };
    });

    const resultJson = obj.filter((item) => item.contrato.length !== 0);

    return res.status(200).json({ data: resultJson });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};
//  crear asociacion
const postAsociacion = async (req, res, next) => {
  let info = {
    nombre: req.body.nombre,
    codigo: req.body.codigo,
    tipo: req.body.tipo,
  };

  try {
    const camp = await asociacion.create(info);
    return res
      .status(200)
      .json({ msg: "Asociación creada con éxito!", status: 200 });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo crear la asociación.", status: 500 });
  }
};

// actualizar asociacion
const updateAsociacion = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await asociacion.update(req.body, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Asociacion actualizada con éxito!", status: 200 });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo actualizar la asociación.", status: 500 });
  }
};

// eliminar asoacion
const deleteAsociacion = async (req, res, next) => {
  let id = req.params.id;
  try {
    let deletes = await asociacion.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Asociación eliminada con éxito!", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "No se pudo eliminar la asociación.", status: 500 });
  }
};

// para asignar los trabajadore mediante excel a la asociacion
const uploadFile = async (req, res, next) => {
  let id = req.params.id;
  try {
    const workbook = XLSX.readFile("./upload/data.xlsx");
    const workbookSheets = workbook.SheetNames;
    const sheet = workbookSheets[0];
    const dataExcel = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

    const result = dataExcel
      .map((v) =>
        Object.entries(v).reduce(
          (acc, [key, value]) =>
            Object.assign(acc, { [key.replace(/\s+/g, "_")]: value }),
          {}
        )
      )
      .filter((item) => !isNaN(item.dni) && item.dni.toString().length === 8);

    const getCodigoTrabajador = await trabajador.findOne({
      attributes: { exclude: ["usuarioId"] },
      order: [["codigo_trabajador", "DESC"]],
    });

    const codigo_final = getCodigoTrabajador?.codigo_trabajador || "CCMRL00000";

    const getNumber = codigo_final.match(/(\d+)$/)?.[1] || "00000";

    const obj = result
      .map((item, i) => {
        let fechaNacimiento;
        const fechaRegex = /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;

        if (!isNaN(item.fecha_nacimiento)) {
          // Si la fecha es un número de serie
          const dateObj = XLSX.SSF.parse_date_code(item.fecha_nacimiento);
          fechaNacimiento = `${dateObj.y}-${dateObj.m
            .toString()
            .padStart(2, "0")}-${dateObj.d.toString().padStart(2, "0")}`;
        } else {
          // Si la fecha ya está en formato de fecha válido
          const match = item.fecha_nacimiento.match(fechaRegex);
          if (match) {
            const year = match[3];
            const month = match[1].length === 1 ? `0${match[1]}` : match[1];
            const day = match[2].length === 1 ? `0${match[2]}` : match[2];
            fechaNacimiento = `${year}-${month}-${day}`;
          } else {
            const parsedDate = dayjs(item.fecha_nacimiento, [
              "DD/MM/YYYY",
              "D/MM/YYYY",
              "DD/M/YYYY",
              "D/M/YYYY",
              "MM/DD/YYYY",
              "M/DD/YYYY",
              "MM/D/YYYY",
              "M/D/YYYY",
              "YYYY-MM-DD",
              "YYYY/MM/DD",
              "YYYY/M/DD",
              "YYYY/MM/D",
              "YYYY/M/D",
              "DD-MM-YYYY",
              "D-MM-YYYY",
              "DD-M-YYYY",
              "D-M-YYYY",
              "MM-DD-YYYY",
              "M-DD-YYYY",
              "MM-D-YYYY",
              "M-D-YYYY",
            ]);
            if (parsedDate.isValid()) {
              fechaNacimiento = parsedDate.format("YYYY-MM-DD");
            } else {
              console.log(`La fecha ${item.fecha_nacimiento} es inválida`);
            }
          }
        }
        return {
          dni: item?.dni,
          codigo_trabajador: `CCMRL${(parseInt(getNumber) + i + 1)
            .toString()
            .padStart(5, "0")}`,

          fecha_nacimiento: fechaNacimiento,
          telefono: item?.telefono,
          apellido_paterno: item?.apellido_paterno,
          apellido_materno: item?.apellido_materno,
          nombre: item?.nombre,
          email: item?.email,
          estado_civil: item?.estado_civil,
          genero: item?.genero,
          asociacion_id: item?.asociacion_id,
          direccion: item?.direccion,
        };
      })
      .filter((item) => item.asociacion_id !== undefined);
    const unique = obj.reduce((acc, current) => {
      if (!acc.find((ele) => ele.dni === current.dni)) {
        acc.push(current);
      }

      return acc;
    }, []);
    console.log(obj);
    if (unique.length !== 0) {
      const nuevoTrabajador = await trabajador.bulkCreate(unique, {
        updateOnDuplicate: [
          "fecha_nacimiento",
          "telefono",
          "email",
          "apellido_paterno",
          "apellido_materno",
          "nombre",
          "email",
          "estado_civil",
          "direccion",
          "asociacion_id",
        ],
      });
      return res.status(200).json({
        msg: `Se registraron ${unique.length} trabajadores con éxito!`,
        status: 200,
      });
    } else {
      return res
        .status(200)
        .json({ msg: "No se pudo registrar a los trabajadores!", status: 500 });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "No se pudo registrar a los trabajadores!", status: 500 });
  }
};

module.exports = {
  getAsociacion,
  postAsociacion,
  updateAsociacion,
  deleteAsociacion,
  uploadFile,
  getAsociacionById,
};
