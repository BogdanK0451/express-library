var Author = require("../models/author");
var async = require("async");
var Book = require("../models/book");
const validator = require("express-validator");

// Display list of all Authors.
exports.author_list = function (req, res) {
  Author.find()
    .sort([["family_name", "ascending"]]) //populate("author")
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("author_list", {
        title: "Author List",
        author_list: list_authors,
      });
    });
};

// Display detail page for a specific Author.
exports.author_detail = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }, "title summary").exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } // Error in API usage.
      if (results.author == null) {
        // No results.
        var err = new Error("Author not found");
        err.status = 404;
        return next(err);
      }
      console.log(results);
      // Successful, so render.
      res.render("author_detail", {
        title: "Author Detail",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// Display Author create form on GET.
exports.author_create_get = function (req, res) {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  validator
    .body("first_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  validator
    .body("family_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  validator
    .body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601(),
  validator
    .body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Sanitize fields.
  validator.sanitizeBody("first_name").escape(),
  validator.sanitizeBody("family_name").escape(),
  validator.sanitizeBody("date_of_birth").toDate(),
  validator.sanitizeBody("date_of_death").toDate(),
  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Create an Author object with escaped and trimmed data.
      var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new author record.
        res.redirect(author.url);
      });
    }
  },
];

// Display Author delete form on GET.
exports.author_delete_get = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        // No results.
        res.redirect("/catalog/authors");
      }
      // Successful, so render.
      res.render("author_delete", {
        title: "Delete Author",
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// Handle Author delete on POST.
exports.author_delete_post = function (req, res, next) {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      // Success
      if (results.authors_books.length > 0) {
        // Author has books. Render in same way as for GET route.
        res.render("author_delete", {
          title: "Delete Author",
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        // Author has no books. Delete object and redirect to the list of authors.
        Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
          if (err) {
            return next(err);
          }
          // Success - go to author list
          res.redirect("/catalog/authors");
        });
      }
    }
  );
};

// Display Author update form on GET.
exports.author_update_get = function (req, res, next) {
  Author.findById(req.params.id, function (err, author) {
    if (err) {
      return next(err);
    }
    if (author == null) {
      // No results.
      var err = new Error("Author not found");
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render("author_form", { title: "Update Author", author });
  });
};

// Handle Author update on POST.
exports.author_update_post = [
  // Validate fields.
  validator
    .body("first_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  validator
    .body("family_name")
    .isLength({ min: 1 })
    .trim()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  validator
    .body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601(),
  validator
    .body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601(),

  // Sanitize fields.
  validator.sanitizeBody("first_name").escape(),
  validator.sanitizeBody("family_name").escape(),
  validator.sanitizeBody("date_of_birth").toDate(),
  validator.sanitizeBody("date_of_death").toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validator.validationResult(req);

    // Create Author object with escaped and trimmed data (and the old id!)
    var author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("author_form", {
        title: "Update Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      Author.findByIdAndUpdate(req.params.id, author, {}, function (
        err,
        theauthor
      ) {
        if (err) {
          return next(err);
        }
        res.redirect(theauthor.url);
      });
    }
  },
];
