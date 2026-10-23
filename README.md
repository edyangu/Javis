# Javis Ticketing

A concert ticketing system for organisers and buyers.

Live demo: https://javis-nine.vercel.app

Built with plain HTML, CSS, and JavaScript. Data is stored in Firebase for
authentication and Firestore for records. The site is hosted on Vercel.

This README is written so that if the project is picked up by someone else,
or resumed in a new conversation, they can understand what exists, what
works, and what still needs building.

What works in this demo

For buyers

Buyers open the homepage and see the current event with its name, location,
entry time, and organiser. Two ticket types are shown: Ordinary and VIP,
each with a price the organiser has set. The buyer enters their name and
phone number, chooses MTN or Airtel, and clicks Pay Now. A confirmation
code is generated in the format JVS followed by two groups of four
characters and a three digit checksum. The code appears as text and as a
QR code, and the buyer can download the ticket as a text file.

For organisers

Organisers register and log in with email and password. From the admin
dashboard they can edit the organisation name, event name, location, entry
time, ordinary price, VIP price, MTN number, and Airtel number. Changes
appear on the public site after a refresh. They can also see all sold
tickets, verify any ticket code by typing it in, and clear all tickets for
demo purposes.

For super admin

A user whose UID exists in the Firestore admins collection sees a gold
SUPER badge on the dashboard. Two extra panels appear: one lists every
organiser registered on the platform, and the other lists every ticket
sold across the platform.

What is simulated and not real yet

These are placeholders and must be replaced before going live.

Payment processing. The buyer is told to send money to an MTN or Airtel
number, but nothing checks whether the money was actually sent. The ticket
is generated regardless. Real integration requires an MTN MoMo or Airtel
Money merchant account, API credentials, and a backend to initiate and
confirm payments.

Ticket delivery. The code appears on screen and can be downloaded. No SMS
or email is sent. Real delivery requires an SMS gateway such as Africa's
Talking or Twilio, or an email service, plus a backend function to trigger
the send.

Single shared event. All organisers share one event document stored at
settings/event in Firestore. In production each organiser should have
their own event.

Super admin assignment. Super admins are added by creating a document in
the admins collection manually in the Firebase Console. There is no in app
interface for this yet.

Ticket security. Anyone can create a ticket document because buyers are
not logged in at checkout. Production requires App Check, rate limiting,
and server side validation.

Project structure

index.html is the public event page and ticket selection.
checkout.html is the payment form and confirmation.
login.html is the organiser login and registration.
dashboard.html is the admin panel with organiser and super admin views.
privacy.html is the privacy policy and terms.

css/style.css contains all styling.

js/firebase.js initialises Firebase and exports app, auth, and db.
js/config.js holds default event values used as fallback.
js/codegen.js generates and verifies ticket codes.
js/tickets.js powers the public event page.
js/checkout.js handles the payment form and QR generation.
js/auth.js handles login and registration.
js/dashboard.js powers the admin panel.

Firestore structure

settings/event holds orgName, eventName, location, entryTime, currency,
mtnNumber, airtelNumber, and a prices map containing ordinary and vip
numbers.

tickets holds one document per sale with code, name, phone, type, amount,
method, event, location, entryTime, status, and issuedAt.

organisers holds one document per registered organiser with email, name,
and createdAt.

admins holds one document per super admin with an email field. The
document ID is the user's UID.

Firebase setup checklist

Create a Firebase project at console.firebase.google.com. Enable
Authentication and turn on the Email/Password provider. Create a Firestore
database in production mode. Add your Vercel domain to Authentication,
Settings, Authorized domains. Copy the Firebase config into
js/firebase.js. Publish the Firestore rules described below.

Firestore rules used in this demo

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }

    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /tickets/{ticketId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    match /organisers/{uid} {
      allow read, write: if isAdmin() || (request.auth != null && request.auth.uid == uid);
    }
  }
}

How to set a super admin

Sign up normally on the site. Go to Firebase Console, Authentication,
Users, and copy the UID of the account. Go to Firestore, Data, and open
the admins collection. Create a document whose ID is that UID. Add a field
called email of type string with the account email. Log out and log back
in. The SUPER badge appears on the dashboard.

Running locally

Any static file server works. For example run python -m http.server 8000
in the project folder and open http://localhost:8000. Firebase requires
localhost to be listed under Authorized domains, and it is by default, so
this works out of the box.

Deploying

The site is deployed to Vercel. Any commit to the main branch of the
GitHub repo triggers an automatic redeploy. No build step is used because
Vercel serves the files directly. After deploying to a new domain,
remember to add that domain to Firebase Authentication, Settings,
Authorized domains.

Ticket code format

Codes are generated in the browser by js/codegen.js. The format is JVS
followed by two groups of four characters and a three digit checksum,
written as JVS XXXX XXXX where each X is a letter or digit and the last
three characters are digits. The four character blocks use the alphabet
ABCDEFGHJKLMNPQRSTUVWXYZ23456789, excluding I, O, 0, and 1 so codes are
easy to read aloud without confusion. The three digit checksum is derived
from the first eight characters, and verifyTicketCode recomputes it to
reject forged or mistyped codes without a database lookup.

Roadmap

Not yet built, listed roughly in order of priority. Real MTN and Airtel
payment integration. Ticket delivery by SMS or email. Per organiser
events to replace the shared settings/event document. In app super admin
management. A mark as used flow so tickets can be consumed at the door.
Search and filter on the dashboard ticket list.
