import { sequelize, DataTypes, contrato, pago, pago_asociacion } from "../../config/db";

const contrato_pago = sequelize.define(
  "contrato_pago",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    contrato_id: DataTypes.INTEGER,
    pago_id: DataTypes.INTEGER,
    teletrans: DataTypes.STRING,
    volquetes: DataTypes.STRING,
  },
  {
    tableName: "contrato_pago",
    timestamp: false,
  }
);
contrato_pago.belongsTo(contrato, { foreignKey: "contrato_id" });
contrato_pago.belongsTo(pago, { foreignKey: "pago_id" });
contrato_pago.hasMany(pago_asociacion, { foreignKey: "contrato_pago_id" });

module.exports = { contrato_pago };