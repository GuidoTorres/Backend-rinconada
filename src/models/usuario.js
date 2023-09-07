import { sequelize, DataTypes, rol, trabajador } from "../../config/db";

const usuario = sequelize.define(
  "usuario",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: DataTypes.STRING,
    contrasenia: DataTypes.STRING,
    usuario: DataTypes.STRING,
    estado: DataTypes.BOOLEAN,
    rol_id: DataTypes.INTEGER,
    cargo_id: DataTypes.INTEGER,
    trabajador_dni: DataTypes.INTEGER,
    foto: DataTypes.STRING,
  },
  {
    tableName: "usuario",
    timestamp: false,
  }
);

usuario.belongsTo(rol, { foreignKey: "rol_id" });

usuario.hasOne(trabajador, {
  through: "trabajador_usuario",
  onDelete: "CASCADE",
  hooks: true,
});

module.exports = { usuario };
