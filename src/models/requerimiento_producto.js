import { sequelize, DataTypes, requerimiento, producto } from "../../config/db";

const requerimiento_producto = sequelize.define(
  "requerimiento_producto",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    requerimiento_id: DataTypes.INTEGER,
    producto_id: DataTypes.INTEGER,
    cantidad: DataTypes.STRING,
  },
  {
    tableName: "requerimiento_producto",
    timestamp: false,
  }
);
requerimiento_producto.belongsTo(requerimiento, {
  foreignKey: "requerimiento_id",
});
requerimiento_producto.belongsTo(producto, { foreignKey: "producto_id" });

module.exports = { requerimiento_producto };
