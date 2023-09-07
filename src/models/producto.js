import { sequelize, DataTypes, almacen, producto_entrada_salida, requerimiento_producto, categoria, transferencia_producto, unidad } from "../../config/db";

const producto = sequelize.define(
    "producto",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      codigo: DataTypes.STRING,
      codigo_interno: DataTypes.STRING,
      codigo_barras: DataTypes.STRING,
      descripcion: DataTypes.STRING,
      categoria_id: DataTypes.INTEGER,
      foto: DataTypes.STRING,
      almacen_id: DataTypes.INTEGER,
      nombre: DataTypes.STRING,
      stock: DataTypes.STRING,
      unidad_id: DataTypes.INTEGER,
      precio: DataTypes.STRING,
      fecha: DataTypes.STRING,
      observacion: DataTypes.STRING,
      costo_total: DataTypes.STRING,
    },
    {
      tableName: "producto",
      timestamp: false,
    }
  );
  producto.belongsTo(almacen, { foreignKey: "almacen_id" });
  producto.hasMany(producto_entrada_salida, { foreignKey: "producto_id" });
  producto.hasMany(requerimiento_producto, { foreignKey: "producto_id" });
  producto.belongsTo(categoria, { foreignKey: "categoria_id" });
  producto.hasMany(transferencia_producto, { foreignKey: "producto_id" });
  producto.belongsTo(unidad, { foreignKey: "unidad_id" });

module.exports = { producto };