// Demo data: node seed.js   (re-running resets the demo school only)
// Default: a full school (Anglophone Form 1 - Upper Sixth, Francophone 6ème - Terminale).  DEMO_SIZE=small: the 4-class school the automated tests use.
require(process.env.DEMO_SIZE=='small'?'./seed-small':'./seed-full');
