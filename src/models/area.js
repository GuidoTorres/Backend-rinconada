import { sequelize, DataTypes, gerencia, cargo, entrada_salida } from "../../config/db";
const area = sequelize.define(
  "area",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    gerencia_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "area",
    timestamp: false,
  }
);

area.belongsTo(gerencia, {
  foreignKey: "gerencia_id",
  onDelete: "CASCADE",
  hooks: true,
});

area.hasMany(cargo, {
  foreignKey: "area_id",
  onDelete: "CASCADE",
  hooks: true,
});
area.hasMany(entrada_salida, { foreignKey: "area_id" });

module.exports = { area };
