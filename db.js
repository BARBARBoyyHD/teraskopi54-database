const {createPool} = require("mysql");

const pool = createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "teraskopi54",
    connectionLimit: 10
})


module.exports = pool