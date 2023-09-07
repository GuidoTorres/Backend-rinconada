import { sequelize, DataTypes, almacen, producto_entrada_salida, area } from "../../config/db";

const entrada_salida = sequelize.define(
    "entrada_salida",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      codigo: DataTypes.STRING,
      motivo: DataTypes.STRING,
      fecha: DataTypes.STRING,
      encargado: DataTypes.STRING,
      codigo_compra: DataTypes.STRING,
      tipo: DataTypes.STRING,
      almacen_id: DataTypes.INTEGER,
      boleta: DataTypes.STRING,
      codigo_requerimiento: DataTypes.STRING,
      area_id: DataTypes.INTEGER,
      dni: DataTypes.STRING,
      costo_total: DataTypes.STRING,
      codigo_pedido: DataTypes.STRING,
      retornable: DataTypes.BOOLEAN,
    },
    {
      tableName: "entrada_salida",
      timestamp: false,
    }
  );
  entrada_salida.belongsTo(almacen, { foreignKey: "almacen_id" });
  entrada_salida.hasMany(producto_entrada_salida, {
    foreignKey: "entrada_salida_id",
  });
  entrada_salida.belongsTo(area, { foreignKey: "area_id" });

module.exports = { entrada_salida };