var express = require("express");
var router = express.Router();
const authorization = require("../middleware/authorization.js");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});



router.post("/api/city/update", authorization, function (req, res, next) {
  // const jwt = authorization.jwt
  if (!req.body.Name || !req.body.CountryCode || !req.body.Population) {
    res.status(400).json({ message: `Error updating population` });
    console.log(`Error on request body:`, JSON.stringify(req.body));

  }
  else {
    const filter = {
      "Name": req.body.Name,
      "CountryCode": req.body.CountryCode
    };
    const pop = {
      "Population": req.body.Population
    };
    req.db('city').where(filter).update(pop)
      .then(_ => {
        res.status(201).json({ message: `Successful update ${req.body.Name}` });
        console.log(`successful population update:`, JSON.stringify(filter));
      }).catch(error => {
        res.status(500).json({ message: 'Database error - not updated' });
      });

  }

});

router.get("/movies/data/:imdbID", function (req, res, next) {
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


router.get("/people/:id", authorization, function (req, res, next) {
  console.log(authorization)
  if (authorization === 401) {
    return res.status(401).json({ Error: true, Message: "Unauthorizedsdad" });
  }
  const nconst = req.params.id;


  req.db
    .from("Names")
    .select("birthYear", "deathYear", "primaryName")
    .where("nconst", "=", nconst)
    .first()
    .then((nameRow) => {
      if (!nameRow) {
        return res.json({ Error: true, Message: "Name not found" });
      }

      req.db
        .from("principals")
        .select("tconst", "category", "characters")
        .where("nconst", "=", nconst)
        .then((principalRows) => {
          if (principalRows.length === 0) {
            const response = {
              name: nameRow.primaryName,
              birthYear: nameRow.birthYear,
              deathYear: nameRow.deathYear,
              roles: [],
            };

            return res.json({
              name: nameRow.primaryName,
              birthYear: nameRow.birthYear,
              deathYear: nameRow.deathYear,
              roles: []
            });
          }

          const tconsts = principalRows.map((row) => row.tconst);

          req.db
            .from("basics")
            .select("primaryTitle", "tconst", "imdbRating")
            .whereIn("tconst", tconsts)
            .then((basicsRows) => {
              const movies = principalRows.map((principalRow) => {
                const movie = basicsRows.find((basicsRow) => basicsRow.tconst === principalRow.tconst);
                let characters = [];
                if (principalRow.characters) {
                  characters = JSON.parse(principalRow.characters);

                }

                return {
                  movieName: movie.primaryTitle,
                  movieId: movie.tconst,
                  category: principalRow.category,
                  characters,
                  imdbRating: movie.imdbRating,
                };
              });

              const response = {
                name: nameRow.primaryName,
                birthYear: nameRow.birthYear,
                deathYear: nameRow.deathYear,
                roles: movies,
              };

              res.json({
                name: nameRow.primaryName,
                birthYear: nameRow.birthYear,
                deathYear: nameRow.deathYear,
                roles: movies
              });
            })
            .catch((err) => {
              console.log(err);
              res.json({ Error: true, Message: "Error in MySQL query" });
            });
        })
        .catch((err) => {
          console.log(err);
          res.json({ Error: true, Message: "Error in MySQL query" });
        });
    })
    .catch((err) => {
      console.log(err);
      res.json({ Error: true, Message: "Error in MySQL query" });
    });
});


// authorization,

router.get("/movies/search", function (req, res, next) {
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