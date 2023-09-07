import { sequelize, DataTypes, contrato_pago, ayuda_pago, destino_pago } from "../../config/db";

const pago = sequelize.define(
    "pago",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
  
      teletrans: DataTypes.STRING,
      observacion: DataTypes.STRING,
      fecha_pago: DataTypes.STRING,
      estado: DataTypes.BOOLEAN,
      tipo: DataTypes.STRING,
      volquetes: DataTypes.STRING,
    },
    {
      tableName: "pago",
      timestamp: false,
    }
  );
  pago.hasMany(contrato_pago, { foreignKey: "pago_id" });
  pago.hasMany(ayuda_pago, { foreignKey: "pago_id" });
  pago.hasMany(destino_pago, { foreignKey: "pago_id" });

module.exports = { pago };