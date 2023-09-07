const {
  pedido,
  requerimiento_pedido,
  requerimiento,
  requerimiento_producto,
  producto,
  area,
  unidad,
  categoria,
} = require("../../config/db");
const {
  generarPdfRequerimiento,
} = require("../utills/PDF/requerimientoBienes");
const _ = require("lodash");

const getPedidoId = async (req, res, next) => {
  try {
    const get = await pedido.findAll({
      include: [
        {
          model: requerimiento_pedido,
          include: [
            {
              model: requerimiento,
              include: [
                {
                  model: requerimiento_producto,
                  include: [
                    {
                      model: producto,
                      attributes: { exclude: ["categoria_id"] },
                      include: [{ model: unidad }, { model: categoria }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    console.log(get);
    const formatData = get
      .map((item) => {
        return {
          id: item.id,
          estado_pedido: item.estado,

          requerimiento_pedidos: item.requerimiento_pedidos.map((data) => {
            return {
              requerimiento_id: data.requerimiento_id,
              estado: data.estado,
              almacen_id: data.requerimiento.almacen_id,
            };
          }),
        };
      })
      .sort((a, b) => {
        return b.id - a.id;
      });
      return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const getPedido = async (req, res, next) => {
  try {
    const get = await pedido.findAll({
      include: [
        {
          model: requerimiento_pedido,
          include: [
            {
              model: requerimiento,
              include: [
                {
                  model: requerimiento_producto,
                  include: [
                    {
                      model: producto,
                      attributes: { exclude: ["categoria_id"] },
                      include: [{ model: unidad }, { model: categoria }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const formatData = get
      .map((item) => {
        return {
          id: item.id,
          fecha: item.fecha,
          estado: item.estado,
          area: item.area,
          celular: item.celular,
          proyecto: item.proyecto,
          solicitante: item.solicitante,
          jefe: item.requerimiento_pedidos.map((data) => data?.requerimiento?.jefe).toString(),
          requerimiento_pedidos: item.requerimiento_pedidos.map((data) => {
            return {
              id: data.id,
              requerimiento_id: data.requerimiento_id,
              pedido_id: data.pedido_id,
              estado: data.estado,
              requerimiento: data.requerimiento,
              productos: data.requerimiento.requerimiento_productos,
            };
          }),
          productos: item.requerimiento_pedidos
            .map((item) => item.requerimiento)
            .map((dat) => dat.requerimiento_productos)
            .flat()
            .reduce((acc, value) => {
              const product = acc.find(
                (ele) =>
                  value.producto.codigo_interno !== "" &&
                  ele.producto.codigo_interno === value.producto.codigo_interno
              );
              if (product) {
                product.cantidad =
                  parseInt(product.cantidad) + parseInt(value.cantidad);
              } else {
                acc.push({
                  producto_id: value.producto_id,
                  cantidad: parseInt(value.cantidad),
                  producto: value.producto,
                });
              }
              return acc;
            }, []),
        };
      })
      .sort((a, b) => {
        return b.id - a.id;
      });

    //corregir los productos por categoria
    return res.status(200).json({ data: formatData });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const postPedido = async (req, res, next) => {
  let info = {
    fecha: req.body.fecha,
    estado: req.body.estado,
    area: req.body.area,
    celular: req.body.celular,
    proyecto: req.body.proyecto,
    solicitante: req.body.solicitante,
  };
  try {
    const post = await pedido.create(info);

    let requerimientoPedido = req.body.req_id.map((item) => {
      return {
        requerimiento_id: item,
        pedido_id: post.id,
      };
    });

    const req_pedido = await requerimiento_pedido.bulkCreate(
      requerimientoPedido
    );

    const updateRequerimiento = await requerimiento.update(
      { estado: "Pedido", completado: "Pedido" },
      {
        where: {
          id: req.body.req_id,
        },
      }
    );
    return res.status(200).json({ msg: "Pedido realizado con éxito!", status: 200 });

    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo crear.", status: 500 });
  }
};

const updatePedido = async (req, res, next) => {
  let id = req.params.id;

  try {
    let update = await pedido.update(req.body, { where: { id: id } });
    return res.status(200).json({ msg: "Actualizado con éxito!", status: 200 });
    next();
  } catch (error) {
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};

const deletePedido = async (req, res, next) => {
  let id = req.params.id;
  let data = req.query.ids;
  const arr = data?.split(",");

  console.log(arr);
  try {
    const getReqPedido = await requerimiento_pedido.findAll({
      where: { pedido_id: id },
    });

    console.log(getReqPedido);
    const filter = getReqPedido.filter(
      (item) => item.estado === "Entregado" || item.estado === "En almacén"
    );

    if (filter.length > 0) {
      return res.status(500).json({
        msg: "No se pudo eliminar el pedido, debido a que algunos productos ya estan en almacén.",
        status: 500,
      });
    } else {
      let delReqPedido = await requerimiento_pedido.destroy({
        where: { pedido_id: id },
      });
      let camp = await pedido.destroy({ where: { id: id } });

      let requerimientoEstado = await requerimiento.update(
        { estado: "Aprobado" },
        { where: { id: arr } }
      );

      return res
        .status(200)
        .json({ msg: "Pedido eliminado con éxito!", status: 200 });
    }

    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};

const getPedidoProducto = async (req, res, next) => {
  let id = req.params.id;

  try {
    let getPedido = await pedido.findAll({
      include: [
        {
          model: requerimiento_pedido,
          include: [
            {
              model: requerimiento,
              include: [
                {
                  model: requerimiento_producto,
                  include: [
                    {
                      model: producto,
                      attributes: { exclude: ["categoria_id"] },
                      include: [{ model: unidad }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ data: getPedido });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};

const descargarPedido = async (req, res, next) => {
  let id = req.params.id;

  try {
    const get = await pedido.findOne({
      where: { id: id },
      include: [
        {
          model: requerimiento_pedido,
          include: [
            {
              model: requerimiento,
              include: [
                {
                  model: requerimiento_producto,
                  include: [{ model: producto }],
                },
              ],
            },
          ],
        },
      ],
    });

    const response = generarPdfRequerimiento(get);

    return res.status(200).json({ data: get });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

module.exports = {
  getPedido,
  // getPedidoById,
  postPedido,
  updatePedido,
  deletePedido,
  getPedidoProducto,
  descargarPedido,
  getPedidoId,
};
