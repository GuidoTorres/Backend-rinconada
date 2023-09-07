import { sequelize, DataTypes, asistencia, trabajador } from "../../config/db";

const trabajadorAsistencia = sequelize.define(
    "trabajador_asistencia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      asistencia_id: DataTypes.INTEGER,
      trabajador_id: DataTypes.STRING,
      asistencia: DataTypes.STRING,
      observacion: DataTypes.STRING,
      hora_ingreso: DataTypes.STRING,
      tarde: DataTypes.STRING,
    },
    {
      tableName: "trabajador_asistencia",
      timestamp: false,
    }
  );
  trabajadorAsistencia.belongsTo(asistencia, { foreignKey: "asistencia_id" });
  trabajadorAsistencia.belongsTo(trabajador, { foreignKey: "trabajador_id" });

module.exports = { trabajadorAsistencia };