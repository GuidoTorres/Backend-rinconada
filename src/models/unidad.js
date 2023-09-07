import { sequelize, DataTypes, producto } from "../../config/db";

const unidad = sequelize.define(
    "unidad",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      codigo: DataTypes.STRING,
      nombre: DataTypes.STRING,
    },
    {
      tableName: "unidad",
      timestamp: false,
    }
  );
  unidad.hasMany(producto, { foreignKey: "unidad_id" });

module.exports = { unidad };