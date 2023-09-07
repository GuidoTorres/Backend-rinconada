const {
  entrada_salida,
  producto,
  producto_entrada_salida,
  area,
  requerimiento,
  pedido,
  requerimiento_pedido,
  unidad,
} = require("../../config/db");
const { Op } = require("sequelize");
const dayjs = require("dayjs");

// entradas y salidas dentro del modulo de logistica

// obtener todas las entradas y salidas en general
const getEntradaSalida = async (req, res, next) => {
  try {
    const all = await entrada_salida.findAll();
    return res.status(200).json({ data: all });
  } catch (error) {
    res.status(500).json();
  }
};
// obtener entradas y salidas por almacen
const getEntradaByAlmacen = async (req, res, next) => {
  let id = req.params.id;
  let tipo = req.query.tipo;

  try {
    const get = await entrada_salida.findAll({
      where: {
        tipo: tipo,
        almacen_id: id,
      },
      attributes: { exclude: ["almacen_id", "alamcen_id", "producto_id"] },
      include: [
        { model: area },
        {
          model: producto_entrada_salida,
          include: [
            {
              model: producto,
              attributes: { exclude: ["categoria_id"] },
              include: [{ model: unidad }],
            },
          ],
        },
      ],
    });

    const format = get.map((item) => {
      return {
        area: item?.area?.nombre,
        area_id: item?.area_id,
        boleta: item?.boleta ? item?.boleta : "----",
        codigo: item?.codigo,
        codigo_compra: item?.codigo_compra ? item?.codigo_compra : "----",
        codigo_pedido: item?.codigo_pedido,
        codigo_requerimiento: item?.codigo_requerimiento,
        costo_total: item?.costo_total,
        dni: item?.dni,
        encargado: item?.encargado,
        fecha: dayjs(item?.fecha).format("YYYY-MM-DD"),
        id: item?.id,
        motivo: item?.motivo,
        producto_entrada_salidas: item?.producto_entrada_salidas,
        retornable: item?.retornable,
        tipo: item?.tipo,
      };
    });

    return res.status(200).json({ data: format });
  } catch (error) {
    console.log(error);
    res.status(500).json();
  }
};
// crear entrada
const postEntrada = async (req, res, next) => {
  let data;
  let updateStock;

  const info = {
    motivo: req?.body?.motivo,
    fecha: req?.body?.fecha,
    dni: req?.body?.dni,
    encargado: req?.body?.encargado,
    codigo_compra: req?.body?.codigo_compra,
    boleta: req?.body?.boleta,
    codigo_pedido: req?.body?.codigo_pedido,
    codigo_requerimiento: req?.body?.codigo_requerimiento,
    tipo: "entrada",
    almacen_id: req.body.almacen_id,
    codigo: req.body.codigo,
  };

  updateStock = req?.body?.productos.map((item) => {
    return {
      id: item.producto_id,
      stock: (parseInt(item.stock)|| 0) + parseInt(item.cantidad),
    };
  });

  try {
    const post = await entrada_salida.create(info);

    const updateMultiple = await Promise.all(
      updateStock.map(
        async (item) =>
          await producto.update(
            { stock: item.stock },
            {
              where: { id: item.id },
            }
          )
      )
    );
    const ProductoEntrada = req.body.productos.map((item) => {
      return {
        entrada_salida_id: post.id,
        producto_id: item.producto_id,
        categoria: item.categoria_id || "",
        cantidad: item.cantidad,
        costo: item.costo,
      };
    });

     await producto_entrada_salida.bulkCreate(
      ProductoEntrada
    );

    // al crear la entrada cambia el estado a en almacen
    if (req.body.codigo_requerimiento !== "" && req.body.codigo_requerimiento !== undefined) {
      const ids = req.body.codigo_requerimiento;

      const idSplit = ids.split(",");

      const pedidoGet = await pedido.findAll({
        where: { id: req.body.codigo_pedido },
        include: [{ model: requerimiento_pedido }],
      });

      const estadoReqPedido = pedidoGet
        .map((item) => item.requerimiento_pedidos)
        .flat()
        .map((item) => item.estado)
        .filter((item) => item === null);

      if (estadoReqPedido === 0) {
        const updatePedido = await pedido.update(
          { estado: "En almacén" },
          { where: { id: req.body.codigo_pedido } }
        );
      }

      const updateRequerimiento = await requerimiento.update(
        { estado: "En almacén" },
        { where: { id: idSplit } }
      );

      const updateRequerimientoPedido = await requerimiento_pedido.update(
        { estado: "entrada" },
        { where: { requerimiento_id: idSplit } }
      );
    }

    return res.status(200).json({
      msg: `Entrada registrada con éxito!`,
      status: 200,
    });

  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: `No se pudo registrar la entrada.`, status: 500 });
  }
};
// crear salida
const postSalida = async (req, res, next) => {
  const info = {
    codigo: req?.body?.codigo,
    retornable: req.body?.retornable,
    motivo: req?.body?.motivo,
    fecha: req?.body?.fecha,
    dni: req?.body?.dni,
    encargado: req?.body?.encargado,
    area_id: req?.body?.area_id,
    codigo_requerimiento: req?.body?.codigo_requerimiento,
    almacen_id: req?.body?.almacen_id,
    costo_total: req?.body?.costo_total,
    tipo: "salida",
  };

  let updateStock = req?.body?.productos.map((item) => {
    return {
      id: item.producto_id,
      stock: parseInt(item.stock) - parseInt(item.cantidad),
    };
  });

  try {
    const post = await entrada_salida.create(info);
    const updateMultiple = await Promise.all(
      updateStock.map(
        async (item) =>
          await producto.update(
            { stock: item.stock },
            {
              where: { id: item.id },
            }
          )
      )
    );
    const ProductoEntrada = req.body.productos.map((item) => {
      return {
        entrada_salida_id: post.id,
        producto_id: item.producto_id,
        categoria: item.categoria_id || "",
        cantidad: item.cantidad,
        costo: item.costo,
      };
    });
    const createProductoEntrada = await producto_entrada_salida.bulkCreate(
      ProductoEntrada
    );
    console.log(req.body);
    // al crear la entrada cambia el estado a en almacen
    if (req.body.codigo_requerimiento !== "") {
      const pedidoGet = await pedido.findAll({
        where: { id: req.body.codigo_pedido },
        include: [{ model: requerimiento_pedido }],
      });

      const estadoReqPedido = pedidoGet
        .map((item) => item.requerimiento_pedidos)
        .flat()
        .map((item) => item.estado)
        .filter((item) => item === null);

      if (estadoReqPedido === 0) {
        const updatePedido = await pedido.update(
          { estado: "Entregado" },
          { where: { id: req.body.codigo_pedido } }
        );
      }
      if (req.body.codigo_requerimiento !== "") {
        const updateRequerimiento = await requerimiento.update(
          { estado: "Entregado" },
          { where: { id: req.body.codigo_requerimiento } }
        );

        const updateRequerimientoPedido = await requerimiento_pedido.update(
          { estado: "Entregado" },
          { where: { requerimiento_id: req.body.codigo_requerimiento } }
        );
      }
    }

    return res.status(200).json({
      msg: `Salida registrada con éxito!`,
      status: 200,
    });

    next();
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: `No se pudo registrar la salida.`, status: 500 });
  }
};
// actualizar entradas y salidas
const updateEntradaSalida = async (req, res, next) => {
  let id = req.params.id;
  let obj = {
    motivo: req?.body?.motivo,
    fecha: req?.body?.fecha,
    dni: req?.body?.dni,
    encargado: req?.body?.encargado,
    codigo_compra: req?.body?.codigo_compra,
    boleta: req?.body?.boleta,
    tipo: "entrada",
  };

  let updateStock = req.body.productos.map((item) => {
    return {
      id: item.producto_id,
      stock: item.cantidad,
    };
  });
  try {
    let update = await entrada_salida.update(obj, { where: { id: id } });
    return res
      .status(200)
      .json({ msg: "Actualizado con éxito !", status: 200 });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo actualizar.", status: 500 });
  }
};
// eliminar entrasdas y salidas
const deleteEntradaSalida = async (req, res, next) => {
  let id = req.params.id;
  try {
    //si es entrada
    let updateStockProducto;

    if (req.body.tipo === "entrada") {
      updateStockProducto = req.body.producto_entrada_salidas.map((item) => {
        return {
          id: item.producto_id,
          stock: parseInt(item.producto.stock) - parseInt(item.cantidad),
        };
      });
      if (req.body.codigo_pedido) {
        const updatePedido = await pedido.update(
          { estado: null },
          { where: { id: req.body.codigo_pedido } }
        );
        const updateReqPedido = await requerimiento_pedido.update(
          { estado: null },
          { where: { pedido_id: req.body.codigo_pedido } }
        );

        if(req.body.codigo_requerimiento){
          let codigo_requerimiento_array = req.body.codigo_requerimiento.split(',').map(Number);

          const updateRequerimiento = await requerimiento.update(
            { estado: "Pedido" },
            {
              where: {
                estado: {
                  [Op.like]: "En almacén",
                },
                id: {
                  [Op.in]: codigo_requerimiento_array,
                },
              },
            }
          );
        }
  
      }
      let delete1 = await producto_entrada_salida.destroy({
        where: { entrada_salida_id: id },
      });
      let camp = await entrada_salida.destroy({ where: { id: id } });
      const updateMultiple = await Promise.all(
        updateStockProducto.map(
          async (item) =>
            await producto.update(
              { stock: item.stock },
              {
                where: { id: item.id },
              }
            )
        )
      );
      return res
        .status(200)
        .json({ msg: "Entrada eliminada con éxito!", status: 200 });
    }
    if (req.body.tipo === "salida") {
      updateStockProducto = req.body.producto_entrada_salidas.map((item) => {
        return {
          id: item.producto_id,
          stock: parseInt(item.producto.stock) + parseInt(item.cantidad),
        };
      });
      if (req.body.codigo_requerimiento !== null) {
        let codigo_requerimiento_array = req.body.codigo_requerimiento.split(',').map(Number);

        const updateRequerimiento = await requerimiento.update(
          { estado: "En almacén" },
          {
            where: {
              estado: {
                [Op.like]: "Entregado",
              },
              id: {
                [Op.in]: codigo_requerimiento_array,
              },
            },
          }
        );
      }
      let delete1 = await producto_entrada_salida.destroy({
        where: { entrada_salida_id: id },
      });

      let camp = await entrada_salida.destroy({ where: { id: id } });
      const updateMultiple = await Promise.all(
        updateStockProducto.map(
          async (item) =>
            await producto.update(
              { stock: item.stock },
              {
                where: { id: item.id },
              }
            )
        )
      );
      return res
        .status(200)
        .json({ msg: "Salida eliminada con éxito!", status: 200 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "No se pudo eliminar.", status: 500 });
  }
};
// estadisticas en base a las salidas 
const entradaSalidaEstadistica = async (req, res, next) => {
  try {
    let almacen = req.body.almacen;
    let fecha_inicio = dayjs(req.body?.fecha_inicio).format("YYYY-MM-DD");
    let fecha_fin = dayjs(req.body?.fecha_fin).format("YYYY-MM-DD");
    let options;
    if (req.body.almacen) {
      options = {
        tipo: "salida",
        fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
        almacen_id: almacen,
        retornable: { [Op.not]: true },
      };
    } else {
      options = {
        tipo: "salida",
        fecha: { [Op.between]: [fecha_inicio, fecha_fin] },
        retornable: { [Op.not]: true },
      };
    }

    const getIngresoEgresos = await entrada_salida.findAll({
      where: options,
      include: [{ model: area }, { model: producto_entrada_salida }],
    });

    const formatData = getIngresoEgresos.map((item) => {
      return {
        id: item?.area?.id,
        area: item?.area?.nombre,
        costo: parseInt(item.costo_total),
      };
    });

    let reduce = formatData.reduce((value, current) => {
      let temp = value.find((o) => o.area === current.area);
      if (temp) {
        temp.costo += current.costo;
      } else {
        value.push(current);
      }
      return value;
    }, []);

    return res.status(200).json({ data: reduce });
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ data: error });
  }
};

module.exports = {
  getEntradaSalida,
  getEntradaByAlmacen,
  postEntrada,
  postSalida,
  updateEntradaSalida,
  deleteEntradaSalida,
  entradaSalidaEstadistica,
};
