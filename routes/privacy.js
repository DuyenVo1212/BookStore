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

router.get('/contact', async (req, res) => { 
    try {
        res.render('privacy/contact', { sectionTitle: 'Liên hệ' });

    } catch (err) { res.status(404).render('page-not-found'); }
//    
});

router.get('/privacy-policy', async (req, res) => { 
    try {
        res.render('privacy/privacy-policy', { sectionTitle: 'Chính sách bảo mật' });

    } catch (err) { res.status(404).render('page-not-found'); }
//    
});

router.get('/conditions', async (req, res) => { 
    try {
        res.render('privacy/conditions', { sectionTitle: 'Điều khoản và dịch vuj' });

    } catch (err) { res.status(404).render('page-not-found'); }
//    
});

router.get('/about', async (req, res) => { 
    try {
        res.render('privacy/about', { sectionTitle: 'Điều khoản và dịch vuj' });

    } catch (err) { res.status(404).render('page-not-found'); }
//    
});

module.exports = router;
