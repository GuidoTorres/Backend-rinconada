import { sequelize, DataTypes, contrato } from "../../config/db";

const teletrans = sequelize.define(
    "teletrans",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      volquete: DataTypes.STRING,
      total: DataTypes.STRING,
      saldo: DataTypes.STRING,
      contrato_id: DataTypes.INTEGER,
      teletrans: DataTypes.STRING,
    },
    {
      tableName: "teletrans",
      timestamp: false,
    }
  );
  teletrans.hasMany(contrato, { foreignKey: "contrato_id" });

module.exports = { teletrans };