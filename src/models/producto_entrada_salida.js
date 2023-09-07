import { sequelize, DataTypes, producto, entrada_salida } from "../../config/db";

const producto_entrada_salida = sequelize.define(
    "producto_entrada_salida",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      entrada_salida_id: DataTypes.INTEGER,
      producto_id: DataTypes.INTEGER,
      categoria: DataTypes.STRING,
      cantidad: DataTypes.STRING,
      costo: DataTypes.STRING,
    },
    {
      tableName: "producto_entrada_salida",
      timestamp: false,
    }
  );
  producto_entrada_salida.belongsTo(producto, { foreignKey: "producto_id" });
  producto_entrada_salida.belongsTo(entrada_salida, {
    foreignKey: "entrada_salida_id",
  });
module.exports = { producto_entrada_salida };