import { ref, onValue } from 'firebase/database';
import { database } from './firebase';

export function fetchData(path, callback) {
  console.log('Fetching data from path:', path);
  const dataRef = ref(database, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    console.log('Data received:', data);
    callback(data);
  });

  return unsubscribe; // Return the unsubscribe function to stop listening when needed
}
