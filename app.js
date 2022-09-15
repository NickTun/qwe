const express = require('express')
const mysql = require('mysql');
const path = require('path')
const session = require('express-session');
const { name } = require('ejs');
const multer = require("multer");
const app = express()
const fs = require("fs");
// Соединение с базой данных
const upload = multer({ dest: "./public/img/" });

require('dotenv').config();

const connection = mysql.createConnection(
{
 host: process.env.DB_HOST,
 database: process.env.DB_NAME,
 user: process.env.DB_USER,
 password: process.env.DB_PASS,
});

connection.connect(function (err) { if (err) throw err; });

// Путь к директории файлов ресурсов (css, js, images)
app.use(express.static('public'))

// Настройка шаблонизатора
app.set('view engine', 'ejs')

// Путь к директории файлов отображения контента
app.set('views', path.join(__dirname, 'views'))

// Обработка POST-запросов из форм
app.use(express.urlencoded({ extended: true }))

// Инициализация сессии
app.use(session({secret: "Secret", resave: false, saveUninitialized: true}));

// Middleware
function isAuth(req, res, next) {
  if (req.session.auth) {
    next();
  } else {
    res.redirect('');
  }
}

// Запуск веб-сервера по адресу http://localhost:3000
app.listen(3003)
/**
 * Маршруты
 */
app.get('/', (req, res) => {
  connection.query("SELECT * FROM items", (err, data, fields) => {
    if (err) throw err;

    res.render('home', {
      'items': data,
      auth: req.session.auth
    });
  });
})

app.get('/items/:id', (req, res) => {
  connection.query("SELECT * FROM items WHERE id=?", [[req.params.id]],
    (err, data, fields) => {
      if (err) throw err;

      res.render('item', {
        item: data[0],
        auth: req.session.auth
      });
  });
})

app.get('/item/:param', (req, res) => {
	connection.query("select * from items where id=?", [[req.params.param]],
	(err, data, fields) => {
		if (err) throw err;

		res.render('test', {item: data[0], auth: req.session.auth});
	});
});

app.get('/add', (req, res) => {
  res.render('add', {
    auth: req.session.auth
  })
})

app.get('/auth', (req, res) => {
  res.render('auth', {
    auth: req.session.auth
  });
});

app.get('/lock', isAuth, (req, res) => {
  res.render('lock', {
    auth: req.session.auth
  });
});

app.post('/store', upload.single("image"), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(
    __dirname,
    "./public/img/" + req.file.originalname
  );

  fs.rename(tempPath, targetPath, (err) => {
    if (err) console.log(err);
  });
  
  connection.query(
    "INSERT INTO items (title, image, description) VALUES (?, ?, ?)",
    [[req.body.title], [req.file.originalname], [req.body.description]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('./')
  });
})

app.post('/update', upload.single("image"), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(
    __dirname,
    "./public/img/" + req.file.originalname
  );

  fs.rename(tempPath, targetPath, (err) => {
    if (err) console.log(err);
  });
  connection.query(
	"UPDATE items SET title=?, image=?, description=? WHERE id=?",
    [[req.body.title], [req.file.originalname], [req.body.description], [req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/')
  });
})

app.post('/remove', (req, res) => {
  console.log(req.body.id);
  connection.query(
    "DELETE FROM items WHERE id=?",
    [[req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('./')
  });
})

app.post('/register', (req, res) => {
  connection.query(
     "INSERT INTO users (name, password) VALUES (?, ?)",
     [[req.body.name], [req.body.password]], (err, data, fields) => {
       if (err) throw err;
 
       req.session.auth = true;
 
       res.redirect('./')
   }); 
 });

 app.post('/login', (req, res) => {
  connection.query(
    "SELECT * FROM users WHERE name=? and password=?",
    [[req.body.name], [req.body.password]], (err, data, fields) => {
      if (err) throw err;
        if(data[0].name == req.body.name && data[0].password == req.body.password)
        {
          console.log("Login success");
          req.session.auth = true;
          res.redirect('./')
        }
        else
        {
          res.redirect('./')
        }
      })
});

app.get('/logout', (req, res) => {
  req.session.auth = false;
  res.redirect('./')
});

app.post("/upload", upload.single("image"), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(
    __dirname,
    "./public/img/" + req.file.originalname
  );

  fs.rename(tempPath, targetPath, (err) => {
    if (err) console.log(err);
    
    res.redirect('./');
  });
});
