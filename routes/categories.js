const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
// const checkAuthentication = require('../middleware/checkAuthentication');
const checkAuthorization = require('../middleware/checkAuthorization');

router.get('/',  async(req, res) => {
    const categories = await Category.find({});
    res.render('categories/home', {categories: categories, user: req.user});
});

router.get('/list',  async(req, res) => {
    const categories = await Category.find({});
    res.render('categories/list', {categories: categories, user: req.user});
});

router.post('/new', checkAuthorization ,async (req, res) => {
    const category = {
        name: req.body.name,
    };
    try{
        const newCate = new Category(category);
        await newCate.save();
        console.log(newCate);
        req.flash('success', 'Tạo danh mục '+ req.body.name +' thành công!');
        res.redirect(`/admin?view=category-create`);
    }catch(e){
        console.log(e);
        res.redirect('/admin?view=category-create', {category: category, errors: { msg: 'Tạo danh mục '+ req.body.name +' thất bại!' }});
    }
});

router.get('/edit/:id', checkAuthorization ,async (req, res)=>{
    const book = await Book.findById(req.params.id);
    res.render('books/edit', {book: book});
});
router.put('/edit/:id', checkAuthorization ,async (req, res)=>{
    const book = {
        title: req.body.title,
        image: req.body.image,
        description: req.body.description,
        price:  parseFloat(req.body.price)
    };
    try{
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, book);
        await updatedBook.save();
        res.redirect(`/books/view/${updatedBook._id}`);
    }catch(e){
        console.log(e);
        res.render('books/new', {book: book});
    }
});

router.delete('/delete/:id', checkAuthorization ,async (req, res) => {
    await Book.findByIdAndDelete(req.params.id);
    res.redirect('/books');
});




module.exports = router;