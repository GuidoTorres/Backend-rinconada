import { sequelize, DataTypes, requerimiento_pedido } from "../../config/db";

const pedido = sequelize.define(
    "pedido",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fecha: DataTypes.STRING,
      estado: DataTypes.STRING,
      area: DataTypes.STRING,
      celular: DataTypes.STRING,
      proyecto: DataTypes.STRING,
      solicitante: DataTypes.STRING,
    },
    {
      tableName: "pedido",
      timestamp: false,
    }
  );
  pedido.hasMany(requerimiento_pedido, { foreignKey: "pedido_id" });

module.exports = { pedido };