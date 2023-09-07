import { sequelize, DataTypes, transferencia, producto } from "../../config/db";

const transferencia_producto = sequelize.define(
  "transferencia_producto",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    transferencia_id: DataTypes.INTEGER,
    producto_origen: DataTypes.INTEGER,
    producto_destino: DataTypes.INTEGER,
    producto_id: DataTypes.INTEGER,

    cantidad: DataTypes.STRING,
    stock_origen: DataTypes.STRING,
    stock_destino: DataTypes.STRING,
  },
  {
    tableName: "transferencia_producto",
    timestamp: false,
  }
);
transferencia_producto.belongsTo(transferencia, {
  foreignKey: "transferencia_id",
});
transferencia_producto.belongsTo(producto, { foreignKey: "producto_id" });

module.exports = { transferencia_producto };
