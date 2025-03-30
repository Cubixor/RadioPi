const mysql = require('mysql2');


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '12345',
    database: 'radio'
})

connection.connect()

connection.query(`INSERT INTO bookmarks
                  VALUES (DEFAULT, ?, ?, ?, ?)`, ['currVidData.url', 'stream', 'currVidData.title', 0], (err, rows, fields) => {
})


connection.end();