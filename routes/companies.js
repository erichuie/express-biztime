"use strict";

const express = require("express");
const { NotFoundError, BadRequestError, ConflictError } = require("../expressError");
const db = require("../db");
// const { errors } = require("undici-types");

const router = express.Router();

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
            FROM companies`
  );

  const companies = results.rows;
  return res.json({ companies });
});

/** Return obj of company: 
 *    {company: {code, name, description, 
 *      invoices: [id, amt, paid, add_date, paid_date]}}
 *  If the company given cannot be found, returns a 404 status response.
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const companyResults = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [code]);

  const company = companyResults.rows[0];
  if (!company) throw new NotFoundError();

  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date
            FROM invoices
            WHERE comp_code = $1`, [code]);

  const invoices = invoiceResults.rows;
  if (!invoices) throw new NotFoundError();
  
  // NOTE: unsure if want to return:
    //invoices: [{id:1}, {id:2}...] or
    //invoices: [{id:1, amt: 100, ...}, {invoice 2}...]
  company.invoices = invoices

  return res.json({ company });
});

/** Adds a company.
 *  Accepts JSON like: {code, name, description}
 *  Returns obj of new company: {company: {code, name, description}}
 */
router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { code, name, description } = req.body;

  let results;
  try {
    results = await db.query(
      `INSERT into companies (code, name, description)
              VALUES($1, $2, $3)
              RETURNING code, name, description`,
      [code, name, description],
    );
  } catch (err) {
    if(err.code === '23505'){
      throw new ConflictError();
    }
  }

  const company = results.rows[0];

  return res.status(201).json({ company });
});

/** Edit existing company.
 *  Accepts JSON like: {name, description}
 *  Returns update company object: {company: {code, name, description}}
 */
router.put("/:code", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { name, description } = req.body;
  const results = await db.query(
    `UPDATE companies
            SET name=$1, description = $2
            WHERE code=$3
            RETURNING code, name, description`,
    [name, description, req.params.code]
  );
  const company = results.rows[0];

  if (company === undefined) throw new NotFoundError();
  return res.json({ company });
});

/** Deletes company.
 *  Returns: {status: "deleted"}
 */
router.delete("/:code", async function (req, res) {

  const results = await db.query(
    `DELETE FROM companies
            WHERE code=$1
            RETURNING code`,
    [req.params.code]
  );
  const company = results.rows[0];

  if (company === undefined) throw new NotFoundError();
  return res.json({ status: "deleted" });
});


module.exports = router;

