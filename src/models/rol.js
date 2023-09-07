import { sequelize, DataTypes, usuario, permisos } from "../../config/db";

const rol = sequelize.define(
  "rol",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    descripcion: DataTypes.STRING,
  },
  {
    tableName: "rol",
    timestamp: false,
  }
);

rol.hasMany(usuario, { foreignKey: "rol_id" });
rol.hasMany(permisos, { foreignKey: "rol_id" });

module.exports = { trabajador_contrato };
