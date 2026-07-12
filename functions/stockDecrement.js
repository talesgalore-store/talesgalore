/**
 * TalesGalore — Razorpay webhook → Contentful stock decrement
 *
 * Flow:
 *   1. Razorpay calls this endpoint the moment a payment is captured.
 *   2. We verify the webhook signature (set up in Razorpay Dashboard →
 *      Settings → Webhooks).
 *   3. We read `book_ids` from the payment's notes (format: "id:qty,id:qty"),
 *      which checkout.js attaches when opening Razorpay Checkout.
 *   4. For each book, we fetch its current stockCount from Contentful via
 *      the Content Management API, decrement it, and publish the update.
 *   5. We record the payment_id in Firestore so a retried/duplicate webhook
 *      delivery never double-decrements stock.
 *
 * Required secrets (set once via `firebase functions:secrets:set <NAME>`,
 * never hardcoded here):
 *   RAZORPAY_WEBHOOK_SECRET     — from Razorpay Dashboard → Settings → Webhooks
 *   CONTENTFUL_MANAGEMENT_TOKEN — Contentful → Settings → API keys →
 *                                  Content management tokens
 *
 * Requires Node 18+ runtime (for global fetch). Firebase Functions v2
 * defaults to Node 18/20 — if your functions/package.json pins an older
 * "engines.node", bump it.
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const crypto = require("crypto");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");
const CONTENTFUL_MANAGEMENT_TOKEN = defineSecret("CONTENTFUL_MANAGEMENT_TOKEN");

// Not secret — this is the same space ID already public in your front-end code.
const CONTENTFUL_SPACE_ID = "tx11zsju5n7c";
const CONTENTFUL_ENVIRONMENT = "master";
// Change this if your space's default locale isn't en-US.
const CONTENTFUL_LOCALE = "en-US";

function verifySignature(rawBody, signatureHeader, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signatureHeader;
}

// "bookId1:2,bookId2:1" -> [{ id: "bookId1", qty: 2 }, { id: "bookId2", qty: 1 }]
function parseBookIds(notesValue) {
  if (!notesValue) return [];
  return notesValue
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [id, qtyStr] = pair.split(":");
      const qty = parseInt(qtyStr, 10);
      return {
        id: (id || "").trim(),
        qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
      };
    })
    .filter((item) => item.id);
}

async function contentfulFetch(path, options, token) {
  const res = await fetch(`https://api.contentful.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Contentful ${options.method || "GET"} ${path} failed: ${res.status} ${body}`
    );
  }
  return res.json();
}

async function decrementBookStock(bookId, qty, token) {
  const basePath = `/spaces/${CONTENTFUL_SPACE_ID}/environments/${CONTENTFUL_ENVIRONMENT}/entries/${bookId}`;

  // 1. Fetch the current entry — we need sys.version (for optimistic
  //    concurrency) and the current stockCount value.
  const entry = await contentfulFetch(basePath, { method: "GET" }, token);

  const currentStock = Number(entry.fields?.stockCount?.[CONTENTFUL_LOCALE] ?? 0);
  const newStock = Math.max(0, currentStock - qty);

  const updatedFields = {
    ...entry.fields,
    stockCount: {
      ...(entry.fields.stockCount || {}),
      [CONTENTFUL_LOCALE]: newStock,
    },
  };

  // If we've just sold the last copy, also flip inStock to false so the
  // catalogue's existing "out of stock" logic (which checks both fields)
  // picks it up immediately.
  if (newStock === 0 && entry.fields.inStock) {
    updatedFields.inStock = {
      ...(entry.fields.inStock || {}),
      [CONTENTFUL_LOCALE]: false,
    };
  }

  // 2. PUT the updated fields — this creates a new draft version.
  const updated = await contentfulFetch(
    basePath,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/vnd.contentful.management.v1+json",
        "X-Contentful-Version": String(entry.sys.version),
      },
      body: JSON.stringify({ fields: updatedFields }),
    },
    token
  );

  // 3. Publish the new version so it's visible via the Content Delivery API
  //    that shop.html / product.html actually read from.
  await contentfulFetch(
    `${basePath}/published`,
    {
      method: "PUT",
      headers: {
        "X-Contentful-Version": String(updated.sys.version),
      },
    },
    token
  );

  logger.info("Contentful stock updated", {
    bookId,
    previousStock: currentStock,
    newStock,
    qty,
  });

  return { bookId, previousStock: currentStock, newStock };
}

exports.razorpayWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET, CONTENTFUL_MANAGEMENT_TOKEN] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.rawBody; // Buffer — Firebase provides this automatically for onRequest

    if (!signature || !rawBody) {
      logger.warn("Webhook request missing signature or raw body");
      res.status(400).send("Bad Request");
      return;
    }

    const isValid = verifySignature(
      rawBody,
      signature,
      RAZORPAY_WEBHOOK_SECRET.value()
    );
    if (!isValid) {
      logger.warn("Invalid Razorpay webhook signature — rejecting");
      res.status(400).send("Invalid signature");
      return;
    }

    const event = req.body?.event;

    // Razorpay sends many event types (payment.authorized, order.paid, etc).
    // We only act on payment.captured — the single, reliable "money has
    // actually landed" signal — to avoid double-processing the same order.
    if (event !== "payment.captured") {
      res.status(200).send("Ignored (not payment.captured)");
      return;
    }

    const payment = req.body?.payload?.payment?.entity;
    if (!payment) {
      res.status(200).send("No payment entity — ignored");
      return;
    }

    const paymentId = payment.id;

    // Idempotency guard: Razorpay retries webhook deliveries that don't
    // respond 2xx quickly, and can occasionally redeliver successful ones
    // too. This makes sure we never decrement stock twice for one order.
    const processedRef = db.collection("processedPayments").doc(paymentId);
    const processedSnap = await processedRef.get();
    if (processedSnap.exists) {
      res.status(200).send("Already processed");
      return;
    }

    const bookIdsRaw = payment.notes?.book_ids || "";
    const books = parseBookIds(bookIdsRaw);

    if (!books.length) {
      logger.warn("payment.captured received with no book_ids in notes", {
        paymentId,
      });
      await processedRef.set({
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "no_book_ids",
      });
      res.status(200).send("No book_ids to process");
      return;
    }

    const token = CONTENTFUL_MANAGEMENT_TOKEN.value();
    const results = [];
    const errors = [];

    for (const { id, qty } of books) {
      try {
        const result = await decrementBookStock(id, qty, token);
        results.push(result);
      } catch (err) {
        logger.error(`Failed to decrement stock for book ${id}`, err);
        errors.push({ id, qty, error: String(err.message || err) });
      }
    }

    await processedRef.set({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentId,
      results,
      errors,
      status: errors.length ? "partial_failure" : "ok",
    });

    // Always respond 200 once the attempt is recorded. Returning a non-2xx
    // here would make Razorpay retry — but since processedPayments is
    // already written, a retry would just hit the idempotency check above
    // and get swallowed without ever fixing a genuine error. Failures are
    // logged (and stored in Firestore under "errors") for manual follow-up
    // instead.
    res.status(200).send(errors.length ? "Processed with errors" : "OK");
  }
);
