import { sequelize, DataTypes, trabajador, contrato } from "../../config/db";

const trabajador_contrato = sequelize.define(
  "trabajador_contrato",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    contrato_id: DataTypes.INTEGER,
    trabajador_dni: DataTypes.STRING,
  },
  {
    tableName: "trabajador_contrato",
    timestamp: false,
  }
);
trabajador_contrato.belongsTo(trabajador, { foreignKey: "trabajador_dni" });
trabajador_contrato.belongsTo(contrato, { foreignKey: "contrato_id" });

module.exports = { trabajador_contrato };
