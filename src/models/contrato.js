import {
  sequelize,
  DataTypes,
  empresa,
  campamento,
  trabajador_contrato,
  asociacion,
  teletrans,
  contrato_pago,
} from "../../config/db";

const contrato = sequelize.define(
  "contrato",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    fecha_inicio: DataTypes.DATE,
    codigo_contrato: DataTypes.INTEGER,
    tipo_contrato: DataTypes.STRING,
    periodo_trabajo: DataTypes.STRING,
    fecha_fin: DataTypes.DATE,
    gerencia: DataTypes.STRING,
    area: DataTypes.STRING,
    jefe_directo: DataTypes.STRING,
    base: DataTypes.STRING,
    termino_contrato: DataTypes.STRING,
    nota_contrato: DataTypes.STRING,
    puesto: DataTypes.STRING,
    campamento_id: DataTypes.INTEGER,
    empresa_id: DataTypes.INTEGER,
    asociacion_id: DataTypes.INTEGER,
    estado: DataTypes.BOOLEAN,
    volquete: DataTypes.STRING,
    teletran: DataTypes.STRING,
    suspendido: DataTypes.BOOLEAN,
    finalizado: DataTypes.BOOLEAN,
    eliminar: DataTypes.BOOLEAN,
    tareo: DataTypes.STRING,
  },
  {
    tableName: "contrato",
    timestamp: false,
  }
);

contrato.belongsTo(empresa, {
  foreignKey: "empresa_id",
  onDelete: "CASCADE",
  hooks: true,
});
contrato.belongsTo(campamento, {
  foreignKey: "campamento_id",
  onDelete: "CASCADE",
  hooks: true,
});
contrato.hasMany(trabajador_contrato, { foreignKey: "contrato_id" });
contrato.belongsTo(asociacion, { foreignKey: "asociacion_id" });
contrato.hasMany(teletrans, { foreignKey: "contrato_id" });
contrato.hasMany(contrato_pago, { foreignKey: "contrato_id" });


module.exports = { contrato };
