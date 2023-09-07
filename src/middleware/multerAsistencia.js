const multer = require("multer");
const path = require("path");
const uploadFile = () => {
  const storage = multer.diskStorage({
    destination: "./upload",

    filename: function (req, res, cb) {
      cb(null, "asistencia.xlsx");
      //poner nombres diferentes a cada imagen
      // cb(null, Date.now() + path.extname(res.originalname));
    },
  });

  const upload = multer({ storage: storage }).single("myFile");
  return upload;
};
module.exports = uploadFile;