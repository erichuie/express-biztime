"use strict";

const express = require("express");
const { NotFoundError } = require("../expressError");
const db = require("../db");

const router = express.Router();

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/", async function(req, res){
  const results = await db.query(
    `SELECT code, name
            FROM companies`
  );

  const companies = results.rows;
  return res.json({ companies });
});







module.exports = router;

