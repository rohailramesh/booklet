const Book = require("../models/Book");

/**
 * Create / save a book for the logged-in user
 * (from scan or manual ISBN)
 */
async function createBook(req, res) {
  const userId = req.user.id;
  const { isbn, title, author, coverUrl, source } = req.body;

  if (!isbn || !title) {
    return res.status(422).json({ message: "ISBN and title are required" });
  }

  try {
    const book = await Book.create({
      user: userId,
      isbn,
      title,
      author,
      coverUrl,
      source, // "scan" or "manual"
    });

    return res.status(201).json(book);
  } catch (err) {
    // Duplicate book for same user (unique index: user + isbn)
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Book already saved by this user" });
    }

    return res.status(400).json({ message: "Could not save book" });
  }
}

/**
 * Get all books for the logged-in user
 */
async function getMyBooks(req, res) {
  const userId = req.user.id;

  const books = await Book.find({ user: userId })
    .sort({ createdAt: -1 })
    .exec();

  return res.status(200).json(books);
}

/**
 * Get a single book by ID (only if it belongs to the user)
 */
async function getBookById(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const book = await Book.findOne({
    _id: id,
    user: userId,
  }).exec();

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book);
}

/**
 * Delete a book (only if it belongs to the user)
 */
async function deleteBook(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const deletedBook = await Book.findOneAndDelete({
    _id: id,
    user: userId,
  }).exec();

  if (!deletedBook) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.sendStatus(204);
}

module.exports = {
  createBook,
  getMyBooks,
  getBookById,
  deleteBook,
};
