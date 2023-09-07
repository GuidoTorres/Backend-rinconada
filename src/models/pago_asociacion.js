import { sequelize, DataTypes, trabajador, contrato_pago } from "../../config/db";

const pago_asociacion = sequelize.define(
  "pago_asociacion",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    teletrans: DataTypes.STRING,
    contrato_pago_id: DataTypes.STRING,
    trabajador_dni: DataTypes.INTEGER,
  },
  {
    tableName: "pago_asociacion",
    timestamp: false,
  }
);
pago_asociacion.belongsTo(trabajador, { foreignKey: "trabajador_dni" });
pago_asociacion.hasMany(contrato_pago, { foreignKey: "contrato_pago_id" });

module.exports = { pago_asociacion };
