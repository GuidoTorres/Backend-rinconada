import { sequelize, DataTypes } from "../../config/db";

const trapiche = sequelize.define(
  "trapiche",

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
    tableName: "trapiche",
    timestamp: false,
  }
);

module.exports = { trapiche };
