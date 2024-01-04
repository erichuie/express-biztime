"use strict";

const express = require("express");
const { NotFoundError, BadRequestError, ConflictError } = require("../expressError");
const db = require("../db");

const router = express.Router();

/** Returns list of invoices, like {invoices: [{id, comp_code}, ...]} */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
            FROM invoices`
  );

  const invoices = results.rows;
  return res.json({ invoices: invoices });
});

/** Return obj of invoice: 
 *    {invoice: {
 *      id, amt, paid, add_date, paid_date, company: {code, name, description}}

 *  If the invoice given cannot be found, returns a 404 status response.
 */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const invoiceResults = await db.query(
    `SELECT id, amt, paid, add_date, paid_date, comp_code
            FROM invoices
            WHERE id = $1`, [id]);

  const invoice = invoiceResults.rows[0];
  if (!invoice) throw new NotFoundError();
  
  const { comp_code } = invoice;
  
  const companyResults = await db.query(
    `SELECT code, name, description
            FROM companies
            WHERE code = $1`, [comp_code]);
  
  const company = companyResults.rows[0];
  if (!company) throw new NotFoundError();
  
  delete(invoice.comp_code);
  invoice.company = company;
  
  return res.json({ invoice });
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
    throw new ConflictError();
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

