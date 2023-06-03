var express = require("express");
var router = express.Router();
const authorization = require("../middleware/authorization.js");

/* GET home page. */
// router.get("/", function (req, res, next) {
//   res.render("index", { title: "Express" });
// });


router.get("/", function (req, res, next) {
  res.send('respond with a resource');
});

router.get("/data/:imdbID", function (req, res, next) {
  req.db
    .from("basics")
    .select()
    .leftJoin("principals", "basics.tconst", "principals.tconst")
    .where("basics.tconst", "=", req.params.imdbID)
    .orWhere("principals.tconst", "=", req.params.imdbID)
    .then((rows) => {
      if (rows.length == 0) {
        res.json({ Error: true, Message: "No record exists of a movie with this ID" });
        return;
      }
      const movieData = {
        title: rows[0].primaryTitle,
        year: rows[0].year,
        runtime: rows[0].runtimeMinutes,
        genres: rows[0].genres.split(","),
        country: rows[0].country,
        principals: rows.map((row) => ({
          id: row.nconst,
          category: row.category,
          name: row.name,
          characters: row.characters ? JSON.parse(row.characters.split(",")) : [],
        })),
        ratings: [
          {
            source: "Internet Movie Database",
            value: rows[0].imdbRating
          },
          {
            source: "Rotten Tomatoes",
            value: rows[0].rottentomatoesRating
          },
          {
            source: "Metacritic",
            value: rows[0].metacriticRating
          }


        ],
        boxoffice: rows[0].boxoffice,
        poster: rows[0].poster,
        plot: rows[0].plot
      };
      res.json(movieData);
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});





// authorization,

router.get("/search", function (req, res, next) {
  let name = "";
  let year = "";
  let page = 1; // Current page number, default: 1
  let limit = 100; // Number of records per page, default: 100
  let prevPage = null;
  let nextPage = null;
  if (req.query.primaryTitle) {
    name = req.query.primaryTitle;
  }
  if (req.query.page) {
    page = parseInt(req.query.page);
  }
  let offset = (page - 1) * limit; // Calculate the offset for pagination
  console.log(page);
  if (req.query.year) {
    year = req.query.year;
    console.log(year);
  }
  console.log(name);

  let totalRecords = 0; // Variable to hold the total number of records

  req.db
    .count("tconst as total")
    .from("basics")
    .where("primaryTitle", "LIKE", `%${name}%`)
    .andWhere("year", "LIKE", `%${year}%`)
    .then((result) => {
      totalRecords = result[0].total;

      let totalPages = Math.ceil(totalRecords / limit); // Calculate the total number of pages
      if (page != totalPages) {
        nextPage = page + 1;
      }
      if (totalPages != 1) {
        prevPage = page - 1;
      }

      req.db
        .from("basics")
        .select()
        .where("primaryTitle", "LIKE", `%${name}%`)
        .andWhere("year", "LIKE", `%${year}%`)
        .limit(limit)
        .offset(offset)
        .then((rows) => {
          if (page > totalPages) {
            // if (totalPages === 1) {
            //   nextPage = null;
            //   prevPage = lastPage - 1;

            // }
            res.json({

              data: [],
              pagination: {
                total: totalRecords,
                lastPage: totalPages,
                prevPage: prevPage,
                nextPage: nextPage,
                perPage: 100,
                currentPage: page,
                from: offset,
                to: offset + rows.length,
              }

            });
          }
          else if (page <= totalPages && rows.length > 0) {
            const specificColumns = rows.map((row) => {
              return {
                title: row.primaryTitle,
                year: row.year,
                imdbID: row.tconst,
                imdbRating: row.imdbRating,
                rottenTomatoesRating: row.rottentomatoesRating,
                metacriticRating: row.metacriticRating,
                classification: row.rated
                // Add more columns as needed
              };
            });
            const pagination = {
              total: totalRecords,
              lastPage: totalPages,
              prevPage: prevPage,
              nextPage: nextPage,
              perPage: 100,
              currentPage: page,
              from: offset,
              to: offset + rows.length,
            };
            res.json({

              data: specificColumns,
              pagination: pagination

            });
          } else {
            res.json({

              Movie: [],
              TotalPages: totalPages,
              CurrentPage: page,
              TotalRecords: totalRecords,
            }); // Handle the case when no rows are returned
          }
        })
        .catch((err) => {
          console.log(err);
          res.json({ Error: true, Message: "Error in MySQL query" });
          return;
        });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
      return;
    });
});

module.exports = router;