import { sequelize, DataTypes, trabajador, trabajadorAsistencia, campamento } from "../../config/db";


const asistencia = sequelize.define(
    "asistencia",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fecha: DataTypes.STRING,
      campamento_id: DataTypes.INTEGER,
      hora_ingreso: DataTypes.STRING,
    },
    {
      tableName: "asistencia",
      timestamp: false,
    }
  );
  asistencia.belongsToMany(trabajador, { through: trabajadorAsistencia });
  asistencia.belongsTo(campamento, { foreignKey: "campamento_id" });
  asistencia.hasMany(trabajadorAsistencia, { foreignKey: "asistencia_id" });

module.exports = { asistencia };