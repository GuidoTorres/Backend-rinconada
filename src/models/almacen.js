import { sequelize, DataTypes, producto, entrada_salida, requerimiento, transferencia } from "../../config/db";

const almacen = sequelize.define(
    "almacen",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: DataTypes.STRING,
      codigo: DataTypes.STRING,
      descripcion: DataTypes.STRING,
    },
    {
      tableName: "almacen",
      timestamp: false,
    }
  );
  almacen.hasMany(producto, { foreignKey: "almacen_id" });
  almacen.hasMany(entrada_salida, { foreignKey: "almacen_id" });
  almacen.hasMany(requerimiento, { foreignKey: "almacen_id" });
  almacen.hasMany(transferencia, { foreignKey: "almacen_id" });

module.exports = { almacen };