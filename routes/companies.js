"use strict";

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");
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

/** Return obj of company: {company: {code, name, description}}
 *  If the company given cannot be found, returns a 404 status response.
 */
router.get("/:code", async function(req, res){
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);
  
  const company = results.rows[0];
  if (!company) throw new NotFoundError();
  
  return res.json({ company });
});

/** Adds a company.
 *  Accepts JSON like: {code, name, description}
 *  Returns obj of new company: {company: {code, name, description}}
 */
router.post("/", async function(req, res){
  if (req.body === undefined) throw new BadRequestError();

  const { code, name, description } = req.body;
  //TODO: throw error if code already exists
  const results = await db.query(
    `INSERT into companies (code, name, description)        
            VALUES($1, $2, $3)
            RETURNING code, name, description`, 
    [code, name, description],
  );
  
  const company = results.rows[0];
  
  return res.status(201).json({ company });
});



module.exports = router;

