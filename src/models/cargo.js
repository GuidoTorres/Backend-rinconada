import { sequelize, DataTypes, area } from "../../config/db";

const cargo = sequelize.define(
    "cargo",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: DataTypes.STRING,
      area_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "cargo",
      timestamp: false,
    }
  );

  cargo.belongsTo(area, {
    foreignKey: "area_id",
    onDelete: "CASCADE",
    hooks: true,
  });

module.exports = { cargo };