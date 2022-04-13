const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const passport = require('passport');
const checkAuthentication = require('../middleware/checkAuthentication');
const Book = require('../models/Book');
const sgMail = require('@sendgrid/mail');
const stripe = require('stripe')(require('../config/keys').stripeKey);
const Order = require('../models/Order');


// Get Route For Register
router.get('/register', (req, res)=>{
    res.render('users/register');
});
// Post Route For Users Reister
router.post('/register', async (req, res) => {
    const foundDuplicate = async(email) => {
        try {
            const duplicate = await User.findOne({ email: email });
            if (duplicate) return true;
            return false;
        } catch (e) {
            console.log(e);
            return false;
        }
    };
    const errors = [];
    const nameRagex = /^[a-zA-Z ]*$/;
    const emailRagex = /^[a-zA-Z0-9\-_]+(\.[a-zA-Z0-9\-_]+)*@[a-z0-9]+(\-[a-z0-9]+)*(\.[a-z0-9]+(\-[a-z0-9]+)*)*\.[a-z]{2,4}$/;
    const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        password_confirmed: req.body.password_confirmed
    };
    if (!nameRagex.test(newUser.name)) {
        errors.push({
            msg: `Tên không được chưa bất kỳ ký tự đặc biệt nào.`
        });
    }
    if (!emailRagex.test(newUser.email)) {
        errors.push({
            msg: `Email không đúng. Vui lòng kiểm tra lại.`
        });
    }
    if (newUser.password.length < 6) {
        errors.push({
            msg: `Mật khẩu phải có ít nhất 6 ký tự`
        });
    }
    if (newUser.password !== newUser.password_confirmed) {
        errors.push({
            msg: `Nhập lại mật khẩu chưa đúng`
        });
    }
    if (await foundDuplicate(newUser.email)) {
        errors.push({
            msg: `Email này đã được đăng ký rồi`
        });
    }
    if (errors.length > 0) {
        res.render('users/register', { errors: errors, newUser: newUser });
    } else {
        try {
            const hashedPassword = await bcrypt.hash(newUser.password, 10);
            try {
                const savedUser = new User({
                    name: newUser.name,
                    email: newUser.email,
                    password: hashedPassword
                });
                await savedUser.save();
                // Mail Options
                req.flash('success', 'Đăng ký thành công. Vui lòng đăng nhập!');
                res.redirect('/users/login');
            } catch (e) {
                res.render('users/register', { errors: { msg: 'Lỗi dữ liệu!' }, newUser: newUser });
            }
        } catch (e) {
            res.render('users/register', { errors: { msg: 'Lỗi máy chủ!' }, newUser: newUser });
        }
    }
});


// Users Login Route
router.get('/login', (req, res) => {
    res.render('users/login');
});

// Users Login Post Route
router.post('/login',passport.authenticate('local', {
    successFlash: true,
    successRedirect:'/books',
    failureFlash: true,
    failureRedirect:'/users/login'
}) ,(req, res) => {});

router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/books');
});

// Cart Route
router.put('/cart/:id',  checkAuthentication , async (req, res)=>{
    try{
        const book = await Book.findById(req.params.id);
        const user = req.user;
        user.carts.push({book});
        User.findByIdAndUpdate(user.id, user, (err, savedUser)=>{
            if(err){
                console.log(err);
                res.redirect('back');
            }else{
                 res.redirect('/users/dashboard');
            }
        });
    }catch(e){
        console.log(e);
         res.redirect('back');
    }
});

// Delete Item
router.delete('/cart/:id/delete', checkAuthentication , async (req, res) => {
    try{
        const user = await User.findById(req.user.id);
        const index = user.carts.findIndex(book => book.equals(req.params.id));
        user.carts.splice(index, 1);
        User.findByIdAndUpdate(user.id, user, (err, savedUser)=>{
            if(err){
                console.log(err);
                res.redirect('back');
            }else{
                 res.redirect('/users/dashboard');
            }
        });
    }catch(e){
        console.log(e);
        res.redirect('back');
    }
});
// Dashboard
router.get('/dashboard', checkAuthentication ,(req, res) => {
    if(req.user.role !== 'admin'){
        User.findById(req.user.id).populate("carts.book").exec((err, user)=>{
            if(err){
                res.redirect('/books');
            }else{
                //  res.json(user);
                res.render('users/dashboard', {user: user});
            }
        });
    }else{
         res.redirect('/admin');
    }
});

router.post('/checkout', checkAuthentication , async (req, res) => {
    try{
        const oldUser = req.user;
        oldUser.carts.forEach(cartItem => {
             cartItem.quantity = req.body[cartItem.book];
        });
        await User.findByIdAndUpdate(oldUser.id, oldUser);

        User.findById(oldUser.id).populate("carts.book").exec((err, user)=>{
            if(err){
                res.redirect('/books');
            }else{
                let total = 0;
                user.carts.forEach(cartItem => {
                    total += cartItem.quantity * cartItem.book.price
               });
               res.render('users/checkout', {user, total});
            }
        });
    }catch(e){
        console.log(e);
        res.redirect('back');
    }
});

router.post('/order', checkAuthentication, async (req, res) => {
    const {stripeEmail, stripeToken } = req.body;
    const customer = await stripe.customers.create({
        email: stripeEmail,
        source: stripeToken,
    });
    User.findById(req.user.id).populate("carts.book").exec( async(err, user)=>{
        if(err){
            req.flash('error', 'Could not Process Your Payment')
            res.redirect('/books');
        }else{
            let total = 0;
            user.carts.forEach(cartItem => {
                total += cartItem.quantity * cartItem.book.price
           });
           const charge = await stripe.charges.create({
                customer: customer.id,
                description: "Book Store Orders",
                amount: total * 100,
                currency: 'inr',
            });
            try {
                const order = new Order({
                    user,
                    details:user.carts,
                    amount: total
                });
                await order.save();
                let updatedUser = req.user;
                updatedUser.carts = [];
                await User.findByIdAndUpdate(updatedUser.id, updatedUser);

                req.flash('success', 'Your Orders are Successful. Order Invoice Sent to your Mail');
                res.redirect('/users/orders');
            } catch (e) {
                 res.json(e);
            }
        }
    });
});

router.get('/orders', checkAuthentication, async (req, res) => {
    const orders = await Order.find({user: req.user}).sort({createdAt:-1}).populate("details.book").exec();
    res.render('users/orders', {orders});
});


module.exports = router;