const express = require('express');
const app = express();


const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const dotenv=require('dotenv')
dotenv.config();
const connectDB = require('./config/db');
const flash = require('connect-flash');
const mongoose = require('mongoose');
connectDB(require('./config/keys').mongoURI);
require('./config/passport')(passport);
//const dotenv=require('dotenv')
//dotenv.config();



app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());//flash dung de hien thi thong bao
app.use((req, res, next) => {
    res.locals.s_m = req.flash('success');
    res.locals.e_m = req.flash('error');
    next();
});// dung de dua du lieu vao tung view

app.get('/', (req, res) => {
     res.redirect('/books');
});



app.use('/books', require('./routes/books'));
app.use('/users', require('./routes/users'));
app.use('/books/:id/comments', require('./routes/comments'));
app.use('/admin', require('./routes/admin'));
app.use('/categories', require('./routes/categories'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, process.env.IP,() => {
    console.log(`Server started on port ${PORT}`);
});