/********* Requires packages *********/
//Mindlewares
const helmet = require("helmet");
const compression = require("compression");
const bodyParser = require("body-parser");
const fs = require("fs");

//Ini Express
const express = require("express");
var app = express();

/************************ server configuration ************************/

//Apply mindlewares
app.use(helmet());
app.use(compression());
app.use(bodyParser.json({ limit: "40mb" }));
app.use(bodyParser.urlencoded({ limit: "40mb", extended: true }));

//Global requires
global.logger = require("./helpers/logger");
global.errorMsg = require("./helpers/error_message");

//config routes
app.post("/api/:version/:route/:method", requestHandler);
//app.get("/api/:version/:route/:method", requestHandler);

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "This Route not exist",
  });
});

//Custom routes
function requestHandler(req, res) {
  try {
    let route = new (require("./routes/" +
      req.params.version +
      "/" +
      req.params.route +
      ".js"))();
    return route[req.params.method](req, res);
  } catch (error) {
    return global.errorMsg.internalError(
      res,
      "API HAS CRASHED - " + error.message,
      req.params.route + "/" + req.params.method,
      error
    );
  }
}

//Start server
const { NODE_ENV, PORT } = require("./config");
app.listen(PORT, () => {
  global.logger.info(`App running on port: ${PORT}`);
  global.logger.info(`Current Environment: ${NODE_ENV}`);
});
