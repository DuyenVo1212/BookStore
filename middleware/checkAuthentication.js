module.exports = function(req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        req.flash('error', `Bạn cần phải đăng nhập trước!`);
        res.redirect('/users/login');
    }
};