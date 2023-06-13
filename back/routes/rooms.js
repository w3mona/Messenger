const express = require('express');
const roomModel = require('../model/room.js');
const msgModel = require('../model/messages.js');
const User = require('../model/user.js');
const router = express.Router()
//const msgModel = require('./model/messages.js');
const ObjectId = require('mongodb').ObjectId;


// TODO: add rest of the necassary imports


module.exports = router;

// temporary rooms
//rooms = []

//Get all the rooms



router.post('/searchForm', async (req, res) => {
  const {search} = req.body;

  var regex = new RegExp(["^", search, "$"].join(""), "i");
  const roomE = await roomModel.findOne({ name: regex });

  if(roomE){
  
  res.json({ roomE: roomE  })
  }
  else
  {
    res.json({ roomE: {name: "Not found", id:0}})
  }
     //res.redirect("/")
  
})

router.get('/all/:userId', async(req, res) => {
    const user = req.params.userId;

    let activeRooms = await msgModel.aggregate([ {"$match": {"sender": new ObjectId(user)} },
    {
      "$lookup": {
        "from": "rooms",
        "localField": "room",
        "foreignField": "_id",
        "as": "roomInfo"
      }
    },
    {
      
      "$set": {
        "_id": {
          "$first": "$roomInfo._id"
        },
        "name":{
          "$first": "$roomInfo.name"
        }
      }
    },

    { "$unset": "roomInfo" },

    { "$group": {
      "_id": "$_id",
      "name": { "$first": "$name" },  //$first accumulator

    }},
    {"$match": { "_id" :{ "$ne" : null } } }
  ])

  console.log("active", activeRooms)



    let allrooms = await roomModel.find({})
    console.log("all rooms", allrooms)

    const user_ = await User.findOne({_id: new ObjectId(user)})

    console.log(user, user_)

    // TODO: you have to check the database to only return the rooms that the user is in
    res.json({rooms:activeRooms, allRooms: allrooms , userRooms:  user_});
});


router.post('/create', async(req, res) => {
    // TODO: write necassary codesn to Create a new room

    const {chatRoomName,userID} = req.body;
    console.log("name", chatRoomName);
    const room = new roomModel ({
        name: chatRoomName
    })


    var regex = new RegExp(["^", chatRoomName, "$"].join(""), "i");
    const roomE = await roomModel.findOne({ name: regex });


    if(!roomE)
    {
        console.log("not exist");

        try{
            const dataSaved = await room.save();
            let roomObj = dataSaved._id
            const user_ = await User.findOne({_id: new ObjectId(userID)})
            user_.rooms.push(roomObj);
            user_.save();
            let rooms = await roomModel.find({})
            res.json({msg:"success", status: true, rooms: rooms, roomName:chatRoomName})
            

            // collection.update(
            //     { _id: id },
            //     { $pull: { 'contact.phone': { number: '+1786543589455' } } }
            //   );


        }
        catch (error){
            //console.log(error);
            res.send("ERROR!")
            res.json({msg:error, status: true})
        }
    }
    else
    {
        console.log("exist");
      res.send({msg:"this room name is taken ", status: true})
    }
});


router.post('/join', (req, res) => {
    // TODO: write necassary codes to join a new room
    console.log(req)
});





router.post('/leave', async (req, res) => {
    const {roomID,userID} = req.body;
    if(userID==req.session.userId)
    {
        
     console.log("roomID",roomID, userID)
     
       let res1= await roomModel.deleteOne( {  _id: new ObjectId(roomID)}  )
       let res2= await msgModel.deleteMany({room: new ObjectId(roomID)})

       console.log("deleted==",res1,res2)
       res.json({ status: res.status})
       //res.redirect("/")
    }


    
   

    // TODO: write necassary codes to delete a room
});


router.get('/messages/:room', async(req, res) => {
    const roomID = req.params.room;
    

    let msgHist = await msgModel.aggregate([
        {"$match": {"room": new ObjectId(roomID)}},
        {
          "$lookup": {
            "from": "users",
            "localField": "sender",
            "foreignField": "_id",
            "as": "userInfo"
          }
        },
        {
          "$set": {
            "username": {
              "$first": "$userInfo.username"
            },
            "photo":{
              "$first": "$userInfo.photo"
            }
          }
        },
        { "$unset": "userInfo" }
      ])

   // let msgHist= await msgModel.find({room: new ObjectId(roomID)})



    // TODO: you have to check the database to only return the rooms that the user is in
    res.json(msgHist)
});


// router.get('/up/messages/:idMsg', async(req, res) => {
//   const msgId = req.params.idMsg;

//   result = await msgModel.updateOne({_id: new ObjectId(msgId) },{ $inc: {likes: 1}} );

//   res.json({msg: res.statusCode})
// });

// router.get('/down/messages/:idMsg', async(req, res) => {
//   const msgId = req.params.idMsg;

//   result = await msgModel.updateOne({_id: new ObjectId(msgId) },{ $inc: {dislikes: 1}} );
  

//   res.json({msg: res.statusCode})
// });



router.post('/up/messages', async(req, res) => {

  const {messageId,userId} = req.body;
  console.log("body",messageId, userId )
  result = await msgModel.updateOne({_id: new ObjectId(messageId) },{ $inc: {likes: 1}} );

  const msg= await msgModel.findOne({_id: new ObjectId(messageId)})
  msg.likesSenders.push(new ObjectId(userId));
  msg.save();

  //result = await msgModel.updateOne({_id: new ObjectId(messageId) },{likes:{ $inc: {counter: 1}}}  ,  { likes: {$push: {sender: userId } }});



  res.json({msg: res.statusCode})
});

router.post('/down/messages', async(req, res) => {
  const {messageId,userId} = req.body;

  result = await msgModel.updateOne({_id: new ObjectId(messageId) },{ $inc: {dislikes: 1} } );



  const msg= await msgModel.findOne({_id: new ObjectId(messageId)})
  msg.dislikeSenders.push(new ObjectId(userId));
  msg.save();

 // result = await msgModel.updateOne({_id: new ObjectId(messageId) },{dislikes:{ $inc: {counter: 1}}}  ,  { likes: {$push: {sender: userId } }});
  

  res.json({msg: res.statusCode})
});



router.post('/edit/messages', async(req, res) => {
  const {editmsgId, newTxt} = req.body;

  result = await msgModel.updateOne({_id: new ObjectId(editmsgId) },{ $set: {message:{ text: newTxt}}} );

 

  console.log("check",editmsgId, newTxt)
  console.log(result, res.statusCode )

  res.json({msg: res.statusCode})
});

  // { "$group": {
  //   "_id": "$_id",
  //   "name": { "$first": "$name" },  //$first accumulator
  //   "count": { "$sum": 1 },  //$sum accumulator
  //   "totalValue": { "$sum": "$value" }  //$sum accumulator
  // }}
