var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var MessagesSchema = new mongoose.Schema({
  id_candidate: Schema.ObjectId,
  id_recruiter: Schema.ObjectId,
  // chatId: Number,
  messages: [
      {
        text: String,
        createdAt: Date,
        user: {
          _id: Schema.ObjectId,
          name: String,
          avatar: String,
        },
      },
    ]
});

module.exports = mongoose.model("Messages", MessagesSchema, "messages");
