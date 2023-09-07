import { sequelize, DataTypes, almacen } from "../../config/db";

const transferencia = sequelize.define(
  "transferencia",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    fecha: DataTypes.STRING,
    almacen_id: DataTypes.INTEGER,
    almacen_origen: DataTypes.STRING,
    almacen_destino: DataTypes.STRING,
    estado_origen: DataTypes.STRING,
    estado_destino: DataTypes.STRING,
  },
  {
    tableName: "transferencia",
    timestamp: false,
  }
);
transferencia.hasMany(transferencia, {
  foreignKey: "transferencia_id",
});
transferencia.belongsTo(almacen, { foreignKey: "almacen_id" });
transferencia.belongsTo(almacen, {
  as: "origen",
  foreignKey: "almacen_origen",
});
transferencia.belongsTo(almacen, {
  as: "destino",
  foreignKey: "almacen_destino",
});
module.exports = { transferencia };
