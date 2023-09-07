import { sequelize, DataTypes, contrato } from "../../config/db";

const empresa = sequelize.define(
  "empresa",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    razon_social: DataTypes.STRING,
    ruc: DataTypes.STRING,
  },
  {
    tableName: "empresa",
    timestamp: false,
  }
);

empresa.hasMany(contrato, {
  foreignKey: "empresa_id",
  onDelete: "CASCADE",
  hooks: true,
});

module.exports = { empresa };
