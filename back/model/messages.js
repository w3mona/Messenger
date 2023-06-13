const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    likes:{
      type: Number,
      default: 0
    },
    dislikes:{
      type: Number,
      default: 0
    },

    likesSenders:{type:Array},

    dislikeSenders:{type:Array}

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", messageSchema);