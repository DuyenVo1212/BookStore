const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Category = require('../models/Category');
// const checkAuthentication = require('../middleware/checkAuthentication');
const checkAuthorization = require('../middleware/checkAuthorization');

router.get('/',  async(req, res) => {
    const books = await Book.find({});
    res.render('books/home', {books: books, user: req.user});
});

router.get('/list',  async(req, res) => {
    var books = await Book.find({});
    if (req.query.cat) {
        books = await Book.find({category: req.query.cat});
    }

    const categories = await Category.find({});
    res.render('books/list', {books: books, categories, user: req.user});
});

router.get('/view/:id', (req, res)=>{
    Book.findById(req.params.id).populate('comments').exec((err, book)=>{
        if(err){
            console.log(err);
            res.redirect('/books');
        }else{
            res.render('books/view', {book: book, user: req.user});
        }
    });
});

router.get('/new', checkAuthorization ,(req, res) => {
    const categories = Category.find({});
    res.render('books/new', {categories});
});

router.post('/new', checkAuthorization ,async (req, res) => {
    const book = {
        title: req.body.title,
        image: req.body.image,
        author: req.body.author,
        description: req.body.description,
        price:  parseFloat(req.body.price),
        sale: parseFloat(req.body.sale)
    };
    try{
        const newBook = new Book(book);
        const foundCate = await Category.findById(req.body.category);
        newBook.category = foundCate;
        await newBook.save();

        foundCate.books.push(newBook);
        const savedCate =  await foundCate.save();
        res.redirect(`/books/view/${newBook._id}`);
    }catch(e){
        console.log(e);
        const categories = Category.find({});
        res.redirect('books/new', {book: book, categories});
    }
});

router.get('/edit/:id', checkAuthorization ,async (req, res)=>{
    const book = await Book.findById(req.params.id);
    const categories = await Category.find({});
    res.render('books/edit', {categories, book});
});
router.put('/edit/:id', checkAuthorization ,async (req, res)=>{
    const book = {
        title: req.body.title,
        image: req.body.image,
        description: req.body.description,
        price:  parseFloat(req.body.price),
        sale: parseFloat(req.body.sale),
        author: req.body.author,
    };
    try{
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, book);
        const foundCate = await Category.findById(req.body.category);
        updatedBook.category = foundCate;
        await updatedBook.save();
        res.redirect(`/books/view/${updatedBook._id}`);
    }catch(e){
        console.log(e);
        res.render('books/new', {book: book});
    }
});

router.delete('/delete/:id', checkAuthorization ,async (req, res) => {
    await Book.findByIdAndDelete(req.params.id);
    res.redirect('/admin?view=books');
});




module.exports = router;