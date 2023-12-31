const express = require('express');
const router = express.Router();
const checkAuthorization = require('../middleware/checkAuthorization');
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const Category = require('../models/Category');

router.get('/', checkAuthorization, async (req, res) => {
    const books = await Book.find();
    const users = await User.find();
    const orders = await Order.find().sort({createdAt:-1}).populate("user").populate("details.book").exec();
    const categories = await Category.find();

    const getCategoryName = (book) => {
        if(book.category) {
            const category = categories.find((category) => {
                return category._id.toString() == book.category;
            });
            return category ? category.name : "none";
        } else {
            return "none";
        }
    }
    res.render('admin/dashboard', {getCategoryName, admin: req.user, books, users, orders, categories, user: req.user, view: req.query.view});
});

module.exports = router;