const pdf = require("html-pdf");

const generarPdfRequerimiento = (data) => {
  const content = `
  <div id="header" style="display: flex; justify-content: center">
  <h1
    style="
      width: 100%;
      text-align: center;
      background-color: #c5e0b3;
      padding: 5px;
    "
  >
    REQUERIMIENTO DE BIENES
  </h1>
</div>
<div style="width: 100%; display: flex; flex-direction: row">
  <div style="width: 50%; display: flex; flex-direction: row; border: 1px solid red">
    <p
      style="
        background-color: #c5e0b3;
        width: 40%;
        text-align: center;
        padding: 5px;
      "
    >
      NOMBRES SOLICITANTE
    </p>
    <p
      style="
        width: 60%;
        text-align: center;
        border: 1px solid black;
        padding: 5px;
      "
    >
      WALTER CALUMANI MAMANI
    </p>
  </div>
  <div style="width: 50%; display: flex; flex-direction: row; border: 1px solid green">
    <p
      style="
        background-color: #c5e0b3;
        width: 40%;
        text-align: center;
        padding: 5px;
      "
    >
      CELULAR
    </p>
    <p
      style="
        width: 50%;
        text-align: center;
        border: 1px solid black;
        padding: 5px;
      "
    >
      967734105
    </p>
  </div>
</div>
<div style="width: 100%; display: flex">
  <div style="width: 45%; display: flex; border: 1px solid red">
    <p
      style="
        background-color: #c5e0b3;
        width: 40%;
        text-align: center;
        padding: 5px;
      "
    >
      ÁREA U OFICINA
    </p>
    <p
      style="
        width: 60%;
        text-align: center;
        border: 1px solid black;
        padding: 5px;
      "
    >
      AREA DE SEGURIDAD Y SALUD OCUPACIONAL
    </p>
  </div>
  <div style="width: 45%; display: flex; border: 1px solid green">
    <p
      style="
        background-color: #c5e0b3;
        width: 40%;
        text-align: center;
        padding: 5px;
      "
    >
      FECHA DE PEDIDO
    </p>
    <p
      style="
        width: 50%;
        text-align: center;
        border: 1px solid black;
        padding: 5px;
      "
    >
      21/11/2022
    </p>
  </div>
</div>
<div style="width: 100%; display: flex">
  <div style="width: 45%; display: flex; border: 1px solid red">
    <p
      style="
        background-color: #c5e0b3;
        width: 40%;
        text-align: center;
        padding: 5px;
      "
    >
      PROYECTO / ACTIVIDAD
    </p>
    <p
      style="
        width: 60%;
        text-align: center;
        border: 1px solid black;
        padding: 5px;
      "
    >
      REQUERIMIENTO AREA SSO
    </p>
  </div>
  <div style="width: 45%; display: flex; border: 1px solid green">
    <p
      style="
        background-color: #c5e0b3;
        width: 40%;
        text-align: center;
        padding: 5px;
      "
    >
      FECHA DE ENTREGA
    </p>
    <p
      style="
        width: 50%;
        text-align: center;
        border: 1px solid black;
        padding: 5px;
      "
    >
      21/11/2022
    </p>
  </div>
</div>
  
`;

  const options = {
    format: "A4",
    
  };

  pdf.create(content, options).toFile("./pdf.pdf", function (err, res) {
    if (err) {
      console.log(err);
    } else {
      console.log(res);
    }
  });
  //   console.log(pdf);
  //   return pdf
};

module.exports = { generarPdfRequerimiento };
