const { where } = require("sequelize");
const {
  transferencia,
  almacen,
  producto,
  transferencia_producto,
} = require("../../config/db");

const getTransferenciaRealizada = async (req, res, next) => {
  let id = req.params.id;
  try {
    const get = await transferencia.findAll({
      where: { almacen_id: id },
      include: [
        { model: almacen, as: "origen" },
        { model: almacen, as: "destino" },
        {
          model: transferencia_producto,
          attributes: { exclude: ["producto_id"] },

          include: [
            { model: producto, attributes: { exclude: ["categoria_id"] } },
          ],
        },
      ],
    });

    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getTransferenciaRecibida = async (req, res, next) => {
  let id = req.params.id;
  try {
    const get = await transferencia.findAll({
      where: { almacen_destino: id },
      include: [
        { model: almacen, as: "origen" },
        { model: almacen, as: "destino" },
        {
          model: transferencia_producto,
          attributes: { exclude: ["producto_id"] },
          include: [
            { model: producto, attributes: { exclude: ["categoria_id"] } },
          ],
        },
      ],
    });

    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const updateTransferencia = async (req, res, next) => {
  let id = req.params.id;

  let info = {
    estado_origen: "Confirmado",
    estado_destino: "Confirmado",
  };

  let updateProductoOrigen = req.body.transferencia_productos.map((item) => {
    return {
      id: item.producto_origen,
      stock: item.stock_origen !== null
              ? parseInt(item.stock_origen) - parseInt(item.cantidad)
              : parseInt(item.cantidad),
    };
  });

  let updateProductoDestino = req.body.transferencia_productos.map((item) => {
    return {
      id: item.producto_destino,
      stock: item.stock_destino !== null
          ? parseInt(item.stock_destino) + parseInt(item.cantidad)
          : parseInt(item.cantidad),
    };
  });
    let concat = updateProductoOrigen.concat(updateProductoDestino);



  try {
    const update = await transferencia.update(info, {
      where: { id: id },
    });


    const updateMultiple = await Promise.all(
      concat.map(
        async (item) =>
          await producto.update(
            { stock: item.stock },
            {
              where: { id: item.id },
            }
          )
      )
    );

    return res.status(200).json({ msg: "Actualizado con éxito.", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res.status(200).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const retornarTransferencia = async (req, res, next) => {
  console.log(req.body);

  let info = {
    estado_origen: "Retornado",
    estado_destino: "Retornado",
  };

  let updateTransferenciaProducto = {
    cantidad: 0,
  };

  try {
    const updateTransferencia = await transferencia.update(info, {
      where: { id: req.body.transferencia_id },
    });

    const update = await transferencia_producto.update(
      updateTransferenciaProducto,
      {
        where: { transferencia_id: req.body.transferencia_id },
      }
    );

    return res.status(200).json({ msg: "Retornado con éxito!", status: 200 });
    next();
  } catch (error) {
    res
      .status(500)
      .json({ msg: "No se pudo realizar el retorno.", status: 500 });
  }
};

const deleteTransferencia = async (req, res, next) => {
  let id = req.params.id;

  console.log(id);
  try {
    let destroyProducto = await transferencia_producto.destroy({ where: { transferencia_id: id } });

    let destroy = await transferencia.destroy({ where: { id: id } });
    return res.status(200).json({ msg: "Transferencia eliminada con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo eliminar", status: 500 });
  }
};

module.exports = {
  getTransferenciaRealizada,
  getTransferenciaRecibida,
  updateTransferencia,
  retornarTransferencia,
  deleteTransferencia
};
