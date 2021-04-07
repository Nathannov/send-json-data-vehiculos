const {NODE_ENV, URL_DEV, URL_TEST, URL_PROD} = require("../../config");
let url = NODE_ENV == "prod" ? URL_PROD : NODE_ENV == "test" ? URL_TEST : URL_DEV;
const multer = require('multer');
const storage = multer.diskStorage({ //multers disk storage settings
    /*destination: function (req, file, cb) {
        cb(null, './uploads/')
    },*/
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
    }
});

const upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) { //file filter
        if (['json', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

class Upload {
    constructor() { }

    uploadFile(req, res) {
        upload(req, res, function (err) {
            if (err) {
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            /** Multer gives us file info in req.file object */
            if (!req.file) {
                res.json({ error_code: 1, err_desc: "No file passed" });
                return;
            }

            //start request process
            if (['json'].indexOf(req.file.originalname.split('.')[req.file.originalname.split('.').length - 1]) >= 0)
                readDataJson(req.file, res);
            else
                readDataExcel(req.file, res);
        });
    };
};
module.exports = Upload;

const exceltojson = require("xlsx-to-json-lc");
const readDataExcel = (file, res) => {
    try {
        exceltojson({
            input: file.path, //the same path where we uploaded our file
            output: null, //since we don't need output.json
            lowerCaseHeaders: false
        }, async (err, result) => {
            if (err) {
                return res.json({ error_code: 1, err_desc: err, data: null });
            }

            url += require("../../config").URI_EXCEL;
            iteratorDataRows(result, url, file.originalname.split(".")[0]);
            res.json({ status: true, message: "Data Excel Loading..." });
        });
    } catch (e) {
        res.json({ error_code: 1, err_desc: "Corupted excel file" });
    }
}

const readDataJson = (file, res) => {
    try {
        const rawData = fs.readFileSync(file.path);
        url += require("../../config").URI_JSON;
        let tableDataJson = JSON.parse(rawData);
        tableDataJson = tableDataJson.rows;

        iteratorDataRows(tableDataJson, url, file.originalname.split(".")[0]);
        res.json({ status: true, message: "Data Json Loading..." });
    } catch (e) {
        res.json({ error_code: 1, err_desc: "ERROR_READING_OR_CREATING_REQUEST" });
    }
}

const fs = require('fs');
const iteratorDataRows = async (arrData, url, filename) => {
    const dataLength = arrData.length,
        responseData = [];
    let record = 0;

    global.logger.info("Total records: " + dataLength);
    global.logger.info("Start process...");

    for (let index = 0; index < dataLength; index++) {
        record = index + 1;
        const row = arrData[index];
        global.logger.info("Record #: " + record);
        const resp = await requestMethod(url, row, 180000);
        
        const myJson = {
            record: record,
            status: resp.response,
            message: resp.message,
            //cpedagogico_id: row.tramite_cpedagogico_id,
            ciu_numDocumento: row.ciu_numDocumento,
            ciu_nombres: row.ciu_nombres,
            ciu_apellidos: row.ciu_apellidos,
            ciu_celular: row.ciu_celular,
            //ciu_direccion: row.ciu_direccion,
            ciu_email: row.ciu_email,
            comparendo_numero: row.comparendo_numero,
            sede: resp.result ? resp.result.Sede : "",
            fecha_agendamiento_curso: resp.result ? resp.result.FechaAgenda : ""
        };
        console.log(myJson);
        responseData.push(myJson);
    }

    global.logger.info("Finish process!");
    fs.writeFileSync("./uploads/" + Date.now() + "-" + filename + ".json", JSON.stringify(responseData), { encoding: 'utf-8' });
}

const request = require('request');
const requestMethod = (API_URL, data, timeout) => {
    return new Promise((resolve) => {
        request.post({
            url: API_URL,
            timeout: timeout ? timeout : 5000,
            json: data
        }, (err, httpResponse, body) => {
            if (err) {
                return resolve({
                    response: false,
                    message: err.code
                });
            }
            try {
                if (!body) body = {};
                resolve(typeof (body) != 'object' ? JSON.parse(body) : body || {});
            } catch (e) {
                global.logger.error("Error getting data URL: " + API_URL + " with body=" + body, e);
                resolve({});
            }
        });
    });
}

const axios = require('axios');
const axiosMethod = (API_URL, data, timeout) => {
    return new Promise((resolve) => {
        axios({
            method: "post",
            url: API_URL,
            data: data
        }).then((response) => {
            console.log("true");
            resolve({ status: true });
        }).catch(function (error) {
            console.log("err");
            resolve({ status: false });
        });
    });
}
