# TalesGalore Website

Pre-loved children's bookstore. Built with plain HTML/CSS/JS, hosted on Netlify, products managed via Contentful CMS, payments via Razorpay.

## Stack
- **Hosting:** Netlify (free)
- **CMS:** Contentful (free tier)
- **Payments:** Razorpay
- **No backend, no database, no monthly fees**

## Setup

### 1. Add your Razorpay Key
Open `js/checkout.js` and replace:
```js
const RAZORPAY_KEY_ID = 'YOUR_RAZORPAY_KEY_ID';
```
With your live key from Razorpay Dashboard → Settings → API Keys.

### 2. Deploy to Netlify
- Push this folder to your GitHub repo
- Netlify auto-deploys on every push

### 3. Connect your domain
In Netlify → Domain Settings → Add custom domain → `talesgalore.com`
Update nameservers at your registrar to Netlify's DNS.

## Adding Books
1. Log into app.contentful.com
2. Content → Add Entry → Book
3. Fill fields, upload cover image, click Publish
4. Site rebuilds automatically in ~60 seconds

## File Structure
```
talesgalore/
├── index.html       # Homepage
├── shop.html        # Shop with filters
├── cart.html        # Cart + Razorpay checkout
├── contact.html     # Contact form
├── netlify.toml     # Netlify config
├── css/
│   └── style.css    # All styles
└── js/
    ├── contentful.js  # Contentful API + card builder
    ├── cart.js        # Cart logic (localStorage)
    ├── home.js        # Homepage book loader
    ├── shop.js        # Shop filters + sort
    ├── checkout.js    # Razorpay integration
    └── contact.js     # Contact form (Netlify Forms)
```
