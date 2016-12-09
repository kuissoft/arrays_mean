var Team = require('../../models/teams');
var User = require('../../models/users');
var datasource_description = require('../../models/descriptions');
var async = require('async');
var mailer = require('../../libs/utils/nodemailer');




module.exports.invite = function(req,res) {

    User.findById(req.user)
    .exec(function(err,foundUser) {
        if (foundUser.isSuperAdmin() || foundUser._admins.indexOf(req.user) >= 0) {
       
            if (!foundUser.invited) {
                foundUser.invited = {};
            }
            var invitedUser;
            if (!req.body._id) { //invite is only for new user

                var new_user = {
                    email: req.body.email,
                    _team: req.body._team,
                    provider: 'local'
                }
                User.create(new_user,function(err,createdUser) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        invitedUser = createdUser._id;

                        foundUser.invited[invitedUser] = {"_editors": req.body._editors, "_viewers": req.body._viewers};
                        
                        console.log(foundUser.invited);
                        foundUser.save(function(err) {
                            if (err) {
                                console.log(err);
                                res.status(500).send(err);
                            } else {
                                Team.findById(req.body._team[0],function(err,team) {

                                    if (err) {
                                        console.log(err);
                                        res.status(500).send(err);
                                    } else {
                                        mailer.sendInvitationEmail(team,foundUser,createdUser,req.body._editors,req.body._viewers,
                                            function(err) {
                                                if (err) res.status(500).send(err);
                                                res.send({code: 200,message: "Invitation Email Sent!"});
                                            })
                                    }
                                })
                            }
                        })
                        
                    }
                })
            } 
        } else {
            return res.status(401).send('unauthorized');
        }
    })
}

