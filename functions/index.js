// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
//const { ref } = require('firebase-functions/lib/providers/database');
admin.initializeApp();

const db = admin.firestore();

// When a Audio Event is written to Firestore, update that users metrics
exports.updateUserMetrics = functions.firestore
.document('/events/{eventUID}')
.onCreate((snap, context) => {

   // retrieve the user event
   const data = snap.data();
   // get the type of user event
   const type = data.type;

   // do certain things depending on the type of event
   if (type === "audio_event") {

        const userRef = db.collection('users').doc(data.user_uid);
        
       return userRef.update({
            "metrics.numberOfMeditations": admin.firestore.FieldValue.increment(1),
            "metrics.secondsListened": admin.firestore.FieldValue.increment(data.secondsListened)
       });

   } else {

       console.log("failed to update user metrics");
       return null;

   }
});


// Initialize the users recommendations when they first open the app/create an account
exports.initializeRecommendations = functions.firestore
.document('users/{userUID}')
.onCreate((snap, context) => { 
    
    // Retrieve the current user object
    const data = snap.data();
    const recommendations = data.recommendations;


    const userUID = context.params.userUID;
    const ref = db.collection('users').doc(userUID);

    // Make sure the recommendations array is empty
    if (recommendations.length === 0) {
        
        const defaultRecommendations = ["NhPmhbJsi65rdMdstQFr", "lIPWxnPK0YMimLFo3Swl"];

        // Return a promise to add the default initial recommendations
        return ref.set({
            recommendations: defaultRecommendations  // The UIDs of the default recommendations
        }, {merge: true});
    } else {
        // This shouldn't happen
        return null;
    }
});







/*
const runTimeOpts = {
    timeoutSeconds: 30,
    memory: '128MB'
};

exports.recommendationsFunction(userUID) = functions.pubsub.schedule('0 0 * * *')
.timeZone('America/New_York') // Users can choose timezone - default is America/Los_Angeles
.runWith(runTimeOpts)
.onRun((context) => {
    console.log('Personal recommendations will be updated every day at midnight Eastern \n But only for users who were active the day before');
    


    return null;
});
*/

