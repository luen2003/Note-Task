const express = require('express');
const app = express();
const tasks = require('./routes/tasks');
const users = require('./routes/users');
const connectDB = require('./db/connect');
const User = require('./models/User')
const notFound = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

var auth = false;
var currentUsername = "";

// middleware

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.set('view engine','ejs');

// routes

app.use('/api/v1/tasks', tasks);
app.use('/api/v1/users', users);

//app.use(notFound);
//app.use(errorHandlerMiddleware);



app.get('/', (req,res) => {
  res.render('index1');
}
)
app.get('/index', (req,res) => {
  if (!auth) {
    res.render('index',{data: {username: ""}});
  } else {
    res.render('index',{data: {username: currentUsername}});
  }
  
}
)


app.get('/login', (req,res) => {
  res.render('login');
})

app.get('/signup', async (req,res) => {
  res.render('signup');
})

app.post('/signup', async (req,res) => {
  const data = {
    username: req.body.username,
    password: req.body.password,
  }
  const existingUser = await User.findOne({username:data.username});
  if (existingUser) {
    res.send("User already exists.");
    return;
  } else {
    const userdata = await User.insertMany(data);
    res.redirect('/login');
    console.log(userdata);
  }
})

app.post('/login', async (req,res) => {
  try {
    const check = await User.findOne({username:req.body.username});
    if (!check) {
      res.send("User Not Found" );
      return;

    }
    if (check && req.body.password == check.password) {
      auth = true;
      currentUsername = check.username;
      res.redirect("index");
    } else {
      res.send("Wrong Password");
      return;

    }
  } catch (error) {
    res.send("Wrong Details");
    return;


  }
})


const port = 5000;

const start = async () => {
  try {
    await connectDB('mongodb+srv://noteadmin:noteadmin@notetask.yyom9hn.mongodb.net/?retryWrites=true&w=majority');
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();