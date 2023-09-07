import { sequelize, DataTypes, almacen, requerimiento_producto, requerimiento_pedido } from "../../config/db";

const requerimiento = sequelize.define(
    "requerimiento",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fecha_pedido: DataTypes.STRING,
      fecha_entrega: DataTypes.STRING,
      solicitante: DataTypes.STRING,
      area: DataTypes.STRING,
      celular: DataTypes.STRING,
      proyecto: DataTypes.STRING,
      codigo_requerimiento: DataTypes.STRING,
      almacen_id: DataTypes.INTEGER,
      estado: DataTypes.STRING,
      aprobacion_jefe: DataTypes.BOOLEAN,
      aprobacion_gerente: DataTypes.BOOLEAN,
      aprobacion_superintendente: DataTypes.BOOLEAN,
      completado: DataTypes.STRING,
      dni: DataTypes.STRING,
    },
    {
      tableName: "requerimiento",
      timestamp: false,
    }
  );
  requerimiento.belongsTo(almacen, { foreignKey: "almacen_id" });
  requerimiento.hasMany(requerimiento_producto, {
    foreignKey: "requerimiento_id",
  });
  requerimiento.hasMany(requerimiento_pedido, { foreignKey: "requerimiento_id" });

module.exports = { requerimiento };