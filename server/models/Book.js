const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const BookSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    isbn: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    author: {
      type: String,
    },

    coverUrl: {
      type: String,
    },

    source: {
      type: String,
      enum: ["scan", "manual"],
    },
  },
  {
    timestamps: true,
  }
);

BookSchema.index({ user: 1, isbn: 1 }, { unique: true });

module.exports = mongoose.model("Book", BookSchema);
