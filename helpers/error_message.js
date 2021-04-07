var typeError = {
  getData: "GETTING_DATA_ERROR",
  createData: "CREATING_DATA_ERROR",
  updateData: "UPDATING_DATA_ERROR",
  convert: "CONVERT_DATA_TYPE_ERROR",
  insertData: "INSERT_DATA_ERROR",
  convertJson: "CONVERT_JSON_ERROR",
  internalError: "INTERNAL_ERROR",
};

class Message {
  gettingDataError(res, message, dataError) {
    global.logger.debug(message, dataError);
    return res.status(400).json({
      success: false,
      error: typeError.getData,
      message: message,
    });
  }

  creatingDataError(res, message, dataError) {
    global.logger.debug(message, dataError);
    return res.status(400).json({
      success: false,
      error: typeError.createData,
      message: message,
    });
  }

  updatingDataError(res, message, dataError) {
    global.logger.debug(message, dataError);
    return res.status(400).json({
      success: false,
      error: typeError.updateData,
      message: message,
    });
  }

  convertDataJsonError(res, message, dataError) {
    global.logger.debug(message, dataError);
    return res.status(400).json({
      success: false,
      error: typeError.convertJson,
      message: message,
    });
  }

  internalError(res, message, dataError) {
    global.logger.error(message, dataError);
    return res.status(400).json({
      success: false,
      error: typeError.internalError,
      message: message,
    });
  }
}

module.exports = new Message();
