import { sequelize, DataTypes } from "../../config/db";

const socio = sequelize.define(
    "socio",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: DataTypes.STRING,
      dni: DataTypes.STRING,
      telefono: DataTypes.STRING,
      cooperativa: DataTypes.STRING,
    },
    {
      tableName: "socio",
      timestamp: false,
    }
  );

module.exports = { socio };