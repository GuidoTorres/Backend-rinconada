import { sequelize, DataTypes, ingresos_egresos, saldo } from "../../config/db";

const sucursal = sequelize.define(
  "sucursal",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    codigo: DataTypes.STRING,
    descripcion: DataTypes.STRING,
    saldo_inicial: DataTypes.FLOAT,
  },
  {
    tableName: "sucursal",
    timestamp: false,
  }
);
sucursal.hasMany(ingresos_egresos, { foreignKey: "sucursal_id" });
sucursal.hasMany(saldo, { foreignKey: "sucursal_id" });

module.exports = { sucursal };
