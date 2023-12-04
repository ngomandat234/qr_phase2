function checkAdmin(req, res, next){
    console.log(req.user)
    if (req.user.group_user !== "admin"){
        res.redirect("/?status=unauthorized")
        return
    }
    next()
}

module.exports = checkAdmin;