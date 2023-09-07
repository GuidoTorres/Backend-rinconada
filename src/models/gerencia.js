import { sequelize, DataTypes, area } from "../../config/db";

const gerencia = sequelize.define(
  "gerencia",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
  },
  {
    tableName: "gerencia",
    timestamp: false,
  }
);

gerencia.hasMany(area, {
  foreignKey: "gerencia_id",
  onDelete: "CASCADE",
  hooks: true,
});

module.exports = { gerencia };
