import { sequelize, DataTypes, trabajador } from "../../config/db";

const evaluacion = sequelize.define(
    "evaluacion",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fecha_evaluacion: DataTypes.DATE,
      puesto: DataTypes.STRING,
      capacitacion_sso: DataTypes.INTEGER,
      capacitacion_gema: DataTypes.INTEGER,
      evaluacion_laboral: DataTypes.INTEGER,
      presion_arterial: DataTypes.FLOAT,
      temperatura: DataTypes.FLOAT,
      saturacion: DataTypes.FLOAT,
      imc: DataTypes.FLOAT,
      pulso: DataTypes.FLOAT,
      diabetes: DataTypes.STRING,
      antecedentes: DataTypes.STRING,
      emo: DataTypes.STRING,
      trabajador_id: DataTypes.STRING,
      aprobado: DataTypes.STRING,
      control: DataTypes.STRING,
      topico: DataTypes.STRING,
      seguridad: DataTypes.STRING,
      medio_ambiente: DataTypes.STRING,
      recomendado_por: DataTypes.STRING,
      cooperativa: DataTypes.STRING,
      condicion_cooperativa: DataTypes.STRING,
      fiscalizador: DataTypes.STRING,
      fiscalizador_aprobado: DataTypes.STRING,
      topico_observacion: DataTypes.STRING,
      control_observacion: DataTypes.STRING,
      seguridad_observacion: DataTypes.STRING,
      medio_ambiente_observacion: DataTypes.STRING,
      recursos_humanos: DataTypes.STRING,
      recursos_humanos_observacion: DataTypes.STRING,
      finalizado: DataTypes.BOOLEAN,
      eliminar: DataTypes.BOOLEAN,
      area: DataTypes.STRING,
      campamento: DataTypes.STRING,
    },
    {
      tableName: "evaluacion",
      timestamp: false,
    }
  );
  evaluacion.belongsTo(trabajador, { foreignKey: "trabajador_id" });

module.exports = { evaluacion };