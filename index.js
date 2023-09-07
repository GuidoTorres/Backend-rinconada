require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require('compression')
require("./src/controllers/controlAsistencia")
const trabajadorRouter = require("./src/routes/trabajador");
const usuarioRouter = require("./src/routes/usuario");
const campamentoRouter = require("./src/routes/campamento");
const rolRouter = require("./src/routes/rol");
const cargoRouter = require("./src/routes/cargo");
const puestoRouter = require("./src/routes/puesto");
const contratoRouter = require("./src/routes/contrato");
const evaluacioRouter = require("./src/routes/evaluacion");
const gerenciaRouter = require("./src/routes/gerencia");
const areaRouter = require("./src/routes/area");
const empresaRouter = require("./src/routes/empresa");
const asociacionRouter = require("./src/routes/asociacion");
const planillaRouter = require("./src/routes/planilla");
const asistenciaRouter = require("./src/routes/asistencia");
const socioRouter = require("./src/routes/socio");
const pagoRouter = require("./src/routes/pagos");
const proveedorRouter = require("./src/routes/proveedor");
const sucursalRouter = require("./src/routes/sucursal");
const saldoRouter = require("./src/routes/saldo");
const finanzaRouter = require("./src/routes/ingresoEgreso");
const almacenRouter = require("./src/routes/almacen");
const productoRouter = require("./src/routes/producto");
const entradaRouter = require("./src/routes/entradaSalida");
const requerimientoRouter = require("./src/routes/requerimiento");
const unidadRouter = require("./src/routes/unidad");
const pedidoRouter = require("./src/routes/pedido");
const transferenciaRouter = require("./src/routes/transferencia");
const categoriaRouter = require("./src/routes/categoria");
const trapicheRouter = require("./src/routes/trapiche");
const volqueteRouter = require("./src/routes/volquete");
const incentivoRouter = require("./src/routes/incentivo");
const casaRouter = require("./src/routes/casa");
const ayudaRouter = require("./src/routes/ayuda");
const buscadorRouter = require("./src/routes/buscador");
const controlRouter = require("./src/routes/controlAsistencia");
const aprobacionRouter = require("./src/routes/aprobacion");
const programacionRouter = require("./src/routes/programacion");

const authRouter = require("./src/routes/auth");

const app = express();
app.use(compression())
const PORT = 3002;
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/img", express.static(path.join(__dirname, "upload/images")));

app.use("/api/v1/trabajador", trabajadorRouter);
app.use("/api/v1/usuario", usuarioRouter);
app.use("/api/v1/campamento", campamentoRouter);
app.use("/api/v1/rol", rolRouter);
app.use("/api/v1/cargo", cargoRouter);
app.use("/api/v1/puesto", puestoRouter);
app.use("/api/v1/contrato", contratoRouter);
app.use("/api/v1/evaluacion", evaluacioRouter);
app.use("/api/v1/gerencia", gerenciaRouter);
app.use("/api/v1/area", areaRouter);
app.use("/api/v1/empresa", empresaRouter);
app.use("/api/v1/asociacion", asociacionRouter);
app.use("/api/v1/planilla", planillaRouter);
app.use("/api/v1/asistencia", asistenciaRouter);
app.use("/api/v1/socio", socioRouter);
app.use("/api/v1/pago", pagoRouter);
app.use("/api/v1/proveedor", proveedorRouter);
app.use("/api/v1/sucursal", sucursalRouter);
app.use("/api/v1/saldo", saldoRouter);
app.use("/api/v1/finanzas", finanzaRouter);
app.use("/api/v1/almacen", almacenRouter);
app.use("/api/v1/producto", productoRouter);
app.use("/api/v1/entrada", entradaRouter);
app.use("/api/v1/requerimiento", requerimientoRouter);
app.use("/api/v1/unidad", unidadRouter);
app.use("/api/v1/pedido", pedidoRouter);
app.use("/api/v1/transferencia", transferenciaRouter);
app.use("/api/v1/categoria", categoriaRouter);
app.use("/api/v1/trapiche", trapicheRouter);
app.use("/api/v1/volquete", volqueteRouter);
app.use("/api/v1/incentivo", incentivoRouter);
app.use("/api/v1/casa", casaRouter);
app.use("/api/v1/ayuda", ayudaRouter);
app.use("/api/v1/filtros", buscadorRouter);
app.use("/api/v1/control", controlRouter);
app.use("/api/v1/aprobacion", aprobacionRouter);
app.use("/api/v1/programacion", programacionRouter);

app.use("/api/v1/auth", authRouter);

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log("server funcionando en puerto", PORT);
});
