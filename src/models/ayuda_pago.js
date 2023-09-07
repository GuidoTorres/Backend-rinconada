import { sequelize, DataTypes, trabajador, pago } from "../../config/db";

const ayuda_pago = sequelize.define(
    "ayuda_pago",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      trabajador_dni: DataTypes.STRING,
      pago_id: DataTypes.INTEGER,
      teletrans: DataTypes.STRING,
    },
    {
      tableName: "ayuda_pago",
      timestamp: false,
    }
  );
  ayuda_pago.belongsTo(trabajador, { foreignKey: "trabajador_dni" });
  ayuda_pago.belongsTo(pago, { foreignKey: "pago_id" });

module.exports = { ayuda_pago };