exports.requireNoSignature = function requireNoSignature(req, res, next) {
    if (req.session.signatureId) {
        return res.redirect("/thanks");
    }
    next();
};

exports.requireSignature = function(req, res, next) {
    if (!req.session.signatureId) {
        return res.redirect("/petition");
    }
    next();
};
