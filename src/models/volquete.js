import { sequelize, DataTypes } from "../../config/db";

const volquete = sequelize.define(
    "volquete",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      placa: DataTypes.STRING,
      propietario: DataTypes.STRING,
    },
    {
      tableName: "volquete",
      timestamp: false,
    }
  );

module.exports = { volquete };