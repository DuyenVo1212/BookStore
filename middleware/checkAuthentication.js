module.exports = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("error", `You need to login first!`);
    res.redirect("/users/login");
  }
};
