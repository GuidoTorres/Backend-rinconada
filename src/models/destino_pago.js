import { sequelize, DataTypes, pago, destino } from "../../config/db";

const destino_pago = sequelize.define(
    "destino_pago",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      pago_id: DataTypes.INTEGER,
      destino_id: DataTypes.INTEGER,
      estado: DataTypes.BOOLEAN,
    },
    {
      tableName: "destino_pago",
      timestamp: false,
    }
  );
  destino_pago.belongsTo(pago, { foreignKey: "pago_id" });
  destino_pago.belongsTo(destino, { foreignKey: "destino_id" });

module.exports = { destino_pago };