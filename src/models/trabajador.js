import {
  sequelize,
  DataTypes,
  usuario,
  asociacion,
  evaluacion,
  trabajador_contrato,
  asistencia,
  trabajadorAsistencia,
  ayuda_pago,
  pago_asociacion,
} from "../../config/db";

const trabajador = sequelize.define(
  "trabajador",
  {
    dni: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    codigo_trabajador: DataTypes.STRING,
    fecha_nacimiento: DataTypes.STRING,
    telefono: DataTypes.INTEGER,
    apellido_paterno: DataTypes.STRING,
    apellido_materno: DataTypes.STRING,
    nombre: DataTypes.STRING,
    email: DataTypes.STRING,
    estado_civil: DataTypes.STRING,
    genero: DataTypes.STRING,
    direccion: DataTypes.STRING,
    asociacion_id: DataTypes.INTEGER,
    deshabilitado: DataTypes.BOOLEAN,
    foto: DataTypes.STRING,
    eliminar: DataTypes.BOOLEAN,
  },
  {
    tableName: "trabajador",
    timestamp: false,
  }
);

trabajador.belongsTo(usuario, {
  through: "trabajador_usuario",
  onDelete: "CASCADE",
  hooks: true,
});

trabajador.belongsTo(asociacion, {
  foreignKey: "asociacion_id",
  onDelete: "CASCADE",
  hooks: true,
});

trabajador.hasMany(evaluacion, { foreignKey: "trabajador_id" });
trabajador.hasMany(trabajador_contrato, { foreignKey: "trabajador_dni" });
trabajador.belongsToMany(asistencia, { through: trabajadorAsistencia });
trabajador.hasMany(trabajadorAsistencia, { foreignKey: "trabajador_id" });
trabajador.hasMany(ayuda_pago, { foreignKey: "trabajador_dni" });
trabajador.hasMany(pago_asociacion, { foreignKey: "trabajador_dni" });

module.exports = { trabajador };
