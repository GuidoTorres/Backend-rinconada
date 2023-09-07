import { sequelize, DataTypes, destino_pago } from "../../config/db";

const destino = sequelize.define(
    "destino",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      hora: DataTypes.STRING,
      placa: DataTypes.STRING,
      propietario: DataTypes.STRING,
      trapiche: DataTypes.STRING,
      volquetes: DataTypes.STRING,
      teletrans: DataTypes.STRING,
    },
    {
      tableName: "destino",
      timestamp: false,
    }
  );
  destino.hasMany(destino_pago, { foreignKey: "destino_id" });

module.exports = { destino };