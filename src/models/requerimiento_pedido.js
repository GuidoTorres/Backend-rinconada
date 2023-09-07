import { sequelize, DataTypes, requerimiento, pedido } from "../../config/db";

const requerimiento_pedido = sequelize.define(
    "requerimiento_pedido",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      requerimiento_id: DataTypes.INTEGER,
      pedido_id: DataTypes.INTEGER,
      estado: DataTypes.STRING,
    },
    {
      tableName: "requerimiento_pedido",
      timestamp: false,
    }
  );
  requerimiento_pedido.belongsTo(requerimiento, {
    foreignKey: "requerimiento_id",
  });
  requerimiento_pedido.belongsTo(pedido, { foreignKey: "pedido_id" });

module.exports = { requerimiento_pedido };