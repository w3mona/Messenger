const express = require('express');
const md5 = require('md5');
const crypto = require('crypto')
const User = require('../model/user');
var uuid = require('uuid')
const router = express.Router()
const ObjectId = require('mongodb').ObjectId;
const FormData = require('form-data');
const user = require('../model/user');


const sessions ={}

//Get all the rooms
router.get('/user/:userId', async(req, res) => {
  const user = req.params.userId;
  let user_
  console.log(req.session.userId, user)
  if(req.session.userId === user)
  {
    user_ = await User.findOne({_id: new ObjectId(user)})
  }
 

  //console.log(rooms)

  // TODO: you have to check the database to only return the rooms that the user is in
  res.json({ user:  user_});
});

router.post('/UpdatePhoto/:userId', async(req, res) => {
  const userId = req.params.userId;


    let uploadFile = req.files.file;
    const name = uploadFile.name;
    //const md5 = uploadFile.md5();

   // const md5 = crypto.createHash('md5').update(uploadFile).digest('hex')
    //const saveAs = `${md5}_${name}`;
    const saveAs = `${new Date().getTime()}_${name}`;
   // const saveAs = `${name}`;
     uploadFile.mv(`${__dirname}/../public/files/${saveAs}`, async function(err) {
      if (err) {
        console.log(err)
        return res.status(500).send(err);
      }
      else
      {
        await User.updateOne({_id: new ObjectId(userId) },{$set: { photo: saveAs} });
        let user_ = await User.findOne({_id: new ObjectId(userId)})
        return res.status(200).json({ status: 'uploaded', user: user_ });
      }
      
    });


});



router.post('/UpdateUser/:userId', async(req, res) => {
  const userId = req.params.userId;
  const {name,  password,email } = req.body;


  let savedData;
  if(password.trim()==="")
      await User.updateOne({_id: new ObjectId(userId) },{$set: { name: name, email: email} });
  else
       await User.updateOne({_id: new ObjectId(userId) },{ $set: {name: name, password:crypto.createHash('md5').update(password).digest("hex"), email: email}} );
 
  let user_ = await User.findOne({_id: new ObjectId(userId)})
 

  // TODO: you have to check the database to only return the rooms that the user is in
  res.json({message:"updated", user: user_});
});


router.post('/cookie', async (req, res) => {

 
  const {session} = req;
  const { _id, username, password } = req.body;

      session.authenticated = true;
      session.username = username;
      session.userId = _id

    
      res.json({ msg: "Logged in", status: true , user:user });
    //res.redirect("/");
    
  }
);

router.post('/login', async (req, res) => {
  const {session} = req;
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user)
    return res.json({ msg: "Incorrect Username ", status: false });
  else if (user.password !== crypto.createHash('md5').update(password).digest("hex") ) 
    return res.json({ msg: "Incorrect password", status: false });
  else {

      session.authenticated = true;
      session.username = username;
      session.userId = user._id
      const sessionToken = uuid.v4()
      const expiresAt = new Date().setFullYear(new Date().getFullYear()+1)
      sessions[sessionToken]= {
        _id: user._id,
        username: user.username,
        password: user.password
      }
    const isSecure = process.env.NODE_ENV != 'development';
    res.header('Access-Control-Allow-Credentials', true)
    res.cookie("session_token",  user, { path:"/"   , maxAge: 60 * 60 * 1000,   httpOnly: false,
      secure: isSecure,
      signed: true} )

    //console.log(session);

   
    res.json({ msg: "Logged in", status: true , sessionToken:sessions[sessionToken], user:user });
    
  }
});

// Set up a route for the logout page
router.post('/logout', async(req, res) => {
//console.log("logout", req.session);
 
    // Clear the session data and redirect to the home page
    req.session.destroy();
    res.clearCookie('session_token')
    res.redirect('/');

   //res.send({msg: "Logged out", status: true})
  });


  router.post('/register',  async (req, res)=>{
    const {username, password,name,email} = req.body;

    let hashed_pass = crypto.createHash('md5').update(password).digest("hex")
    const user = new User ({
        username: username,
        password:  hashed_pass,
        name: name,
        email: email,
        photo:''
    })

    var regex = new RegExp(["^", username, "$"].join(""), "i");
    const userE = await User.findOne({ username: regex });

    if(!userE)
    {
        try{
            const dataSaved = await user.save();
            console.log(user)
            res.status(200).json(dataSaved);

        }
        catch (error){
            console.log(error);
            res.send(error)
        }
    }
    else
    {
      res.json({msg:"this username is taken ", status: true})
    }
})

module.exports = router;
