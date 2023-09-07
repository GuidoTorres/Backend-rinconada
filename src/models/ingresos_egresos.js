import { sequelize, DataTypes, sucursal } from "../../config/db";

const ingresos_egresos = sequelize.define(
    "ingresos_egresos",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      fecha: DataTypes.STRING,
      movimiento: DataTypes.STRING,
      forma_pago: DataTypes.STRING,
      encargado: DataTypes.STRING,
      area: DataTypes.STRING,
      cantidad: DataTypes.STRING,
      medida: DataTypes.STRING,
      descripcion: DataTypes.STRING,
      monto: DataTypes.STRING,
      proveedor: DataTypes.STRING,
      comprobante: DataTypes.STRING,
      sucursal_id: DataTypes.INTEGER,
      saldo_inicial: DataTypes.FLOAT,
      ingresos: DataTypes.FLOAT,
      egresos: DataTypes.FLOAT,
      saldo_final: DataTypes.FLOAT,
      dni: DataTypes.STRING,
      sucursal_transferencia: DataTypes.STRING,
      nro_comprobante: DataTypes.STRING,
      precio: DataTypes.STRING,
      categoria: DataTypes.STRING,
    },
    {
      tableName: "ingresos_egresos",
      timestamp: false,
    }
  );
  ingresos_egresos.belongsTo(sucursal, { foreignKey: "sucursal_id" });

module.exports = { ingresos_egresos };