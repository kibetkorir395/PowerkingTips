import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, query, updateDoc, where, orderBy, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_Z8QqRxIFNKM_EQibqx5rH22icKefGy4",
  authDomain: "myfootballtips-de149.firebaseapp.com",
  projectId: "myfootballtips-de149",
  storageBucket: "myfootballtips-de149.firebasestorage.app",
  messagingSenderId: "758162443258",
  appId: "1:758162443258:web:9b981990779020cda0f243",
  measurementId: "G-L24VM8Q3KS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const signInUser = (email, password, setError) => {
  signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    const user = userCredential.user;
    alert(`User with ${user.email} has logged in successfully`);
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setError(errorMessage);
  });
  return;
}

export const registerUser = (username, email, password, setSuccess, setError) => {
  createUserWithEmailAndPassword(auth, email, password).then(async (userCredential) => {
    const user = userCredential.user;
    const userDocRef = doc(db, "users", user.email);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return setError("The user already exists! Login insted.");
    }
    await setDoc(userDocRef, {
      email: user.email,
      username: username,
      isPremium: false,
      subscription: null
    }).then(async (response) => {
      setSuccess(`User with ${user.email} has been registered successfully`)
    }).catch(async (error) => {
      const errorMessage = await error.message;
      setError(errorMessage);
    });
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setError(errorMessage);
  });
  return;
}

export const updateUser = async (userId, isPremium, subscription, subDate) => {
  const usercollref = doc(db, 'users', userId)
  updateDoc(usercollref, {
    isPremium,
    subscription,
    subDate
  }).then(response => {
    //alert("updated")
  }).catch(error => {
    //console.log(error.message)
  })
}

export const getUser = async (userId, setUserData) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    setUserData(userDoc.data());
  } else {
    console.error("User not found");
  }
};


export const getAllusers = async (setUsers, setLoading) => {
  setLoading(true);
  const usersCollectionRef = collection(db, "users");


  const users = [];
  await getDocs(usersCollectionRef).then((data) => {
    data.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
  }).then(() => {
    setUsers(users);
    setLoading(false);
  }).catch(err => setLoading(false));
};

export const addContact = async (data, setSuccess, setError) => {
  const contactsDocRef = collection(db, "contacts");
  await addDoc(contactsDocRef, { ...data, responded: false }).then(async (userCredential) => {
    setSuccess("We will get back to you as soon as possible.")
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setError(errorMessage);
  });
};


export const addTip = async (data, setError, setLoading) => {
  setLoading(true);
  const tipsDocRef = doc(db, "tips", data.home.trim() + data.away.trim() + data.date.split("/").join(""));
  await setDoc(tipsDocRef, {
    ...data
  }).then(async (docRef) => {
    alert("tip added")
    window.location.replace(`/tips`);
  }).catch(async (error) => {
    setError(error.message);
    setLoading(false);
  });
  setLoading(false)
};

export const updateTip = async (id, data, setError, setLoading, setData) => {
  setLoading(true);
  const tipsDocRef = doc(db, "tips", id);
  await updateDoc(tipsDocRef, {
    ...data
  }).then(async (docRef) => {
    alert("Tip updated successfully!");

    const docSnap = await getDoc(tipsDocRef); // Fetch the document

    if (docSnap.exists()) {
      setData(docSnap.data());
      return docSnap.data();
    } else {
      return null;
    }
  }).catch(async (error) => {
    setError(error.message);
    setLoading(false);
  });
  setLoading(false)
};


export const getTips = async (pagination, setTips, setLoading, currentDate) => {
  setLoading(true);
  const tipsCollectionRef = collection(db, "tips");
  var q = query(tipsCollectionRef, where("date", "==", currentDate), limit(pagination));

  const tips = [];
  await getDocs(q).then((data) => {
    data.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() });
    });
  }).then(() => {
    setTips(tips);
    setLoading(false);
  }).catch(err => setLoading(false));
};

export const getAllTips = async (setTips, setLoading) => {
  setLoading(true);
  const tipsCollectionRef = collection(db, "tips");
  var q = query(tipsCollectionRef, orderBy("date"));

  const tips = [];
  await getDocs(q).then((data) => {
    data.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() });
    });
  }).then(() => {
    setTips(tips.reverse());
    setLoading(false);
  }).catch(err => setLoading(false));
};

export const getWonTips = async (pagination, setTips) => {
  const tipsCollectionRef = collection(db, "tips");
  const q = query(
    tipsCollectionRef,
    where("won", "==", "won"),
    where("premium", "==", true), // Only include premium tips
    limit(pagination)
  );
  const tips = [];
  try {
    const data = await getDocs(q);
    data.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() });
    });

    // Sort tips by date (make sure 'date' is a valid field in your documents)
    const sortedTips = tips.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Set the sorted tips
    setTips(sortedTips);
  } catch (err) {
    console.error("Error fetching tips:", err);
    // Handle the error as needed
  }
};