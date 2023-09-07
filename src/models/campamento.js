import { sequelize, DataTypes, contrato, asistencia } from "../../config/db";

const campamento = sequelize.define(
  "campamento",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    direccion: DataTypes.STRING,
  },
  {
    tableName: "campamento",
    timestamp: false,
  }
);
campamento.hasMany(contrato, {
  foreignKey: "campamento_id",
  onDelete: "CASCADE",
  hooks: true,
});
campamento.hasMany(asistencia, { foreignKey: "campamento_id" });

module.exports = { campamento };
