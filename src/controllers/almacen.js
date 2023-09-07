const {
  almacen,
  producto,
  transferencia,
  transferencia_producto,
  unidad,
  categoria,
} = require("../../config/db");

// get de todos los alamacenes
const getAlmacen = async (req, res, next) => {
  try {
    const get = await almacen.findAll();
    return res.status(200).json({ data: get });
  } catch (error) {
    res.status(500).json();
  }
};

//get de alamacen por id
const getAlmacenById = async (req, res, next) => {
  let id = req.params.id;

  try {
    const getById = await almacen.findAll({
      where: { id: id },
    });
    return res.status(200).json({ data: getById });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// crear un almacen
const postAlmacen = async (req, res, next) => {
  try {
    const post = await almacen.create(req.body);
    return res
      .status(200)
      .json({ msg: "Almacén registrado con éxito!", status: 200 });

  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo registrar el almacén.", status: 500 });
  }
};

// actualizar almacen
const updateAlmacen = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await almacen.update(req.body, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Almacén actualizado con éxito!", status: 200 });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo actualizar el almacén.", status: 500 });
  }
};

//eliminar almacen
const deleteAlmacen = async (req, res, next) => {
  let id = req.params.id;
  try {
    let camp = await almacen.destroy({ where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Almacén eliminado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

// get de los productos que pertenecen a un alamcen en especifico
const getProductsByAlmacen = async (req, res, next) => {
  let id = req.params.id;
  try {
    let get = await producto.findAll({
      where: { almacen_id: id },
      attributes: { exclude: ["categoria_id"] },
      include: [{ model: unidad }, { model: categoria }],
    });
    const formatData = get.map((item) => {
      return {
        id: item?.id,
        codigo: item?.codigo,
        codigo_interno: item?.codigo_interno,
        codigo_barras: item?.codigo_barras,
        descripcion: item?.descripcion,
        foto: item?.foto,
        almacen_id: item?.almacen_id,
        nombre: item?.nombre,
        stock: item?.stock,
        unidad_id: item?.unidad?.id,
        unidad: item?.unidad?.nombre,
        precio: item?.precio,
        fecha: item?.fecha,
        observacion: item?.observacion,
        costo_total: item?.costo_total,
        categoria_id: item?.categorium?.id,
        categoria: item?.categorium?.descripcion,
      };
    });
    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

//para realizar las transferencias entre almacenes
const almacenTrasferencia = async (req, res, next) => {
  let transferenciaFormat = {
    fecha: req.body.at(-1).fecha,
    almacen_id: req.body.at(-1).almacen_origen,
    almacen_origen: req.body.at(-1).almacen_origen,
    almacen_destino: req.body.at(-1).almacen_destino,
    estado_origen: "Pendiente",
    estado_destino: "Pendiente",
  };

  try {
    const postTransferencia = await transferencia.create(transferenciaFormat);

    let transferenciaAlmacen = req.body.map((item) => {
      return {
        producto_id: item.producto_origen,
        producto_origen: item.producto_origen,
        cantidad: item.cantidad,
        transferencia_id: postTransferencia.id,
        producto_destino: item.producto_destino,
        stock_origen: item.stock_origen,
        stock_destino: item.stock_destino,
      };
    });

    const postTransferenciaAlmacen = await transferencia_producto.bulkCreate(
      transferenciaAlmacen
    );

    return res
      .status(200)
      .json({ msg: "Transferencia realizada con éxito!", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "No se pudo realizar la transferencia.", status: 500 });
  }
};

module.exports = {
  getAlmacen,
  getAlmacenById,
  postAlmacen,
  updateAlmacen,
  deleteAlmacen,
  getProductsByAlmacen,
  almacenTrasferencia,
};
