import { sequelize, DataTypes } from "../../config/db";

const proveedor = sequelize.define(
  "proveedor",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    dni: DataTypes.STRING,
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    descripcion: DataTypes.STRING,
  },
  {
    tableName: "proveedor",
    timestamp: false,
  }
);

module.exports = { proveedor };
