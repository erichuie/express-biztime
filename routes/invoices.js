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

  delete (invoice.comp_code);
  invoice.company = company;

  return res.json({ invoice });
});

/** Adds an invoice.
 *  Accepts JSON like: {comp_code, amt}
 *  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { comp_code, amt } = req.body;

  let results;
  try {
    results = await db.query(
      `INSERT into invoices (comp_code, amt)
              VALUES($1, $2)
              RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt],
    );
  } catch (err) {
    if (err.code === '22003') {
      return res.json({
        "error": "the amount sent is out of range"
      });
    }
    else if (err.code === '23503') {
      return res.json({
        "error": "company doesn't exist in this app"
      });
    }
    else {
      throw new BadRequestError();
    }
  }

  const invoice = results.rows[0];

  return res.status(201).json({ invoice });
});

/** Edit existing invoice.
 *  Accepts JSON like: {amt}
 *  Returns updated invoice object: 
 *    {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  let results;

  try  {
    results = await db.query(
      `UPDATE invoices
              SET amt=$1
              WHERE id=$2
              RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.amt, req.params.id]
    );
  } catch (err) {
  if (err.code === '22003') {
    return res.json({
      "error": "the amount sent is out of range"
    });
  } else {
    throw new BadRequestError();
  }
}

  const invoice = results.rows[0];
  if (invoice === undefined) throw new NotFoundError();
  
  return res.json({ invoice });
});

/** Deletes invoice.
 *  Returns: {status: "deleted"}
 */
router.delete("/:id", async function (req, res) {

  const results = await db.query(
    `DELETE FROM invoices
            WHERE id=$1
            RETURNING id`,
    [req.params.id]
  );
  const invoice = results.rows[0];

  if (invoice === undefined) throw new NotFoundError();
  return res.json({ status: "deleted" });
});


module.exports = router;

