import { sequelize, DataTypes, sucursal } from "../../config/db";

const saldo = sequelize.define(
    "saldo",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      saldo_inicial: DataTypes.FLOAT,
      ingresos: DataTypes.FLOAT,
      egresos: DataTypes.FLOAT,
      saldo_final: DataTypes.FLOAT,
      sucursal_id: DataTypes.INTEGER,
    },
    {
      tableName: "saldo",
      timestamp: false,
    }
  );
  saldo.belongsTo(sucursal, { foreignKey: "sucursal_id" });

module.exports = { saldo };