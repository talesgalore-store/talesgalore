/**
 * TalesGalore — Cloud Functions entry point.
 *
 * Firebase looks specifically for a file named index.js in the functions/
 * folder and deploys whatever is exported from here. Add future functions
 * the same way: create a new file, require it, export it below.
 */

const { razorpayWebhook } = require("./stockDecrement");
exports.razorpayWebhook = razorpayWebhook;
