import { sequelize, DataTypes, trabajador, contrato } from "../../config/db";

const asociacion = sequelize.define(
  "asociacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    codigo: DataTypes.STRING,
    tipo: DataTypes.STRING,
  },
  {
    tableName: "asociacion",
    timestamp: false,
  }
);

asociacion.hasMany(trabajador, {
  foreignKey: "asociacion_id",
  onDelete: "CASCADE",
  hooks: true,
});
asociacion.hasMany(contrato, { foreignKey: "asociacion_id" });

module.exports = { asociacion };
