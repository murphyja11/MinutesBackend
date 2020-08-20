// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
//const { ref } = require('firebase-functions/lib/providers/database');
admin.initializeApp();

const db = admin.firestore();

// When a Audio Event is written to Firestore, update that users metrics
exports.updateMetrics = functions.firestore
.document('/events/{eventUID}')
.onCreate((snap, context) => {

   // retrieve the user event
   const data = snap.data();
   // get the type of user event
   const type = data.type;

   // do certain things depending on the type of event
   if (type === "audio_event") {

    const metricsRef = db.collection('metrics').doc(data.user_uid);

    const genre = data.audio_metadata.genre;

    const datejs = data.time.toDate();
    const day = datejs.getDate();
    const month = datejs.getMonth();
    const year = datejs.getFullYear();
    const date = `${year}-${month}-${day}`;

    //ISO8601DateFormatter.string(from: Date(), timeZone: TimeZone.current, 
       //formatOptions: [.withFullDate, .withDashSeparatorInDate])
    
    return metricsRef.set({
        numberOfMeditations: admin.firestore.FieldValue.increment(1),
        secondsListened: admin.firestore.FieldValue.increment(data.secondsListened),
        genres: {
            [`${genre}`]: {
                numberOfMeditations: admin.firestore.FieldValue.increment(1),
                secondsListened: admin.firestore.FieldValue.increment(data.secondsListened)
            }
        },
        daily: {
            [`${date}`]: {
                numberOfMeditations: admin.firestore.FieldValue.increment(1),
                secondsListened: admin.firestore.FieldValue.increment(data.secondsListened),
                genres: {
                    [`${genre}`]: {
                        numberOfMeditations: admin.firestore.FieldValue.increment(1),
                        secondsListened: admin.firestore.FieldValue.increment(data.secondsListened)
                    }
                }
            }
        }
    }, {merge: true});

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
    let recommendations = data.recommendations;


    const userUID = context.params.userUID;
    const userRef = db.collection('users').doc(userUID);
    const recRef = db.collection('recommendations').doc(userUID);

    // if the recommendations array is null set to empty
    if (recommendations === null) {
        recommendations = []
    }
    if (recommendations.length === 0) {
        
        // The UIDs of the default recommendations
        const defaultRecommendations = ["NhPmhbJsi65rdMdstQFr", "lIPWxnPK0YMimLFo3Swl"]; 

        let batch = db.batch();

        // Perform a batched write to both the user document and the rec document
        batch.set(userRef, {
            recommendations: defaultRecommendations 
        }, {merge: true});
        batch.set(recRef, {
            array: defaultRecommendations
        }, {merge: true});

        // Commit the batched write
        return batch.commit();

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

