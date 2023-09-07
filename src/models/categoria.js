import { sequelize, DataTypes, producto } from "../../config/db";

const categoria = sequelize.define(
    "categoria",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      abreviatura: DataTypes.INTEGER,
      descripcion: DataTypes.INTEGER,
    },
    {
      tableName: "categoria",
      timestamp: false,
    }
  );
  categoria.hasMany(producto, { foreignKey: "categoria_id" });

module.exports = { categoria };