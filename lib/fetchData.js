import { ref, onValue } from 'firebase/database';
import { database } from './firebase';

export function fetchData(path, callback) {
  const dataRef = ref(database, path);
  
  // Add error handling
  try {
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log(`Data received from ${path}:`, data);
        callback(data);
      } else {
        console.log(`No data available at ${path}`);
        callback(null);
      }
    }, (error) => {
      console.error(`Error fetching data from ${path}:`, error);
      callback(null);
    });

    return unsubscribe;
  } catch (error) {
    console.error(`Error setting up listener for ${path}:`, error);
    return () => {};
  }
}
