var express = require("express");
var router = express.Router();
const authorization = require("../middleware/authorization.js");
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});
router.get("/:id", authorization, function (req, res, next) {
    // console.log(authorization)
    // if (authorization === 401) {
    //     return res.status(401).json({ Error: true, Message: "Unauthorizedsdad" });
    // }
    const nconst = req.params.id;
    console.log("id is:" + nconst)

    req.db.from("Names")
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
module.exports = router;