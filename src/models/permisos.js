import { sequelize, DataTypes, rol } from "../../config/db";

const permisos = sequelize.define(
    "permisos",
  
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      administracion: DataTypes.BOOLEAN,
      administracion_usuario: DataTypes.BOOLEAN,
      administracion_campamento: DataTypes.BOOLEAN,
      administracion_rol: DataTypes.BOOLEAN,
      personal: DataTypes.BOOLEAN,
      personal_trabajador: DataTypes.BOOLEAN,
      personal_grupal: DataTypes.BOOLEAN,
      personal_empresa: DataTypes.BOOLEAN,
      personal_socio: DataTypes.BOOLEAN,
      planillas: DataTypes.BOOLEAN,
      planillas_asistencia: DataTypes.BOOLEAN,
      planillas_control: DataTypes.BOOLEAN,
      logistica: DataTypes.BOOLEAN,
      logistica_inventario: DataTypes.BOOLEAN,
      logistica_almacen: DataTypes.BOOLEAN,
      logistica_requerimiento: DataTypes.BOOLEAN,
      logistica_aprobacion: DataTypes.BOOLEAN,
      logistica_transferencia: DataTypes.BOOLEAN,
      logistica_categoria: DataTypes.BOOLEAN,
      logistica_estadistica: DataTypes.BOOLEAN,
      finanzas: DataTypes.BOOLEAN,
      finanzas_ingreso: DataTypes.BOOLEAN,
      finanzas_proveedor: DataTypes.BOOLEAN,
      finanzas_sucursal: DataTypes.BOOLEAN,
      rol_id: DataTypes.INTEGER,
      personal_contrato: DataTypes.BOOLEAN,
      personal_evaluacion: DataTypes.BOOLEAN,
    },
    {
      tableName: "permisos",
      timestamp: false,
    }
  );
  permisos.belongsTo(rol, { foreignKey: "rol_id" });

module.exports = { permisos };