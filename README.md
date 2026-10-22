# Javis Ticketing Demo

Concert ticketing system. Demo version uses localStorage for data.
Production version will move data to Firebase and deploy on Vercel.

## Features (demo)
- Ordinary ticket (default 50,000 UGX) and VIP ticket (default 150,000 UGX)
- Admin panel to change prices, event name, location, entry time, payment numbers
- MTN and Airtel mobile money selection (simulated)
- Confirmation code generator with checksum verification
- Privacy Policy and Terms of Service pages
- Multi-user organiser accounts (demo only)

## Default admin login
Email: admin@javis.local
Password: admin123

## File structure
See project root.

## Roadmap
1. Replace localStorage with Firebase Firestore.
2. Replace demo auth with Firebase Authentication.
3. Add real MTN/Airtel collections API integration.
4. Deploy to Vercel.

## Deploy to Vercel (static)
1. Push to GitHub.
2. Import the repo in Vercel.
3. Framework preset: Other. Output dir: root.
4. Deploy.
