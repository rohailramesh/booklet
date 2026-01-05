const express = require("express");
const router = express.Router();

const bookController = require("../../controllers/bookController");
const authMiddleware = require("../../middleware/auth");

/**
 * All book routes are protected
 * User must be logged in (JWT)
 */

// Create / save a book
router.post("/", authMiddleware, bookController.createBook);

// Get all books for logged-in user
router.get("/", authMiddleware, bookController.getMyBooks);

// Get a single book by ID (owned by user)
router.get("/:id", authMiddleware, bookController.getBookById);

// Delete a book (owned by user)
router.delete("/:id", authMiddleware, bookController.deleteBook);

module.exports = router;
