import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { increment } from "firebase/database";
import {addDoc, collection, doc, getDoc, getDocs, getFirestore, limit, query, updateDoc, where, orderBy, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyANFhP14_BJOaImr50PiFoychlbR88JeXU",
  authDomain: "powerking-betting-tips.firebaseapp.com",
  databaseURL: "https://powerking-betting-tips-default-rtdb.firebaseio.com",
  projectId: "powerking-betting-tips",
  storageBucket: "powerking-betting-tips.appspot.com",
  messagingSenderId: "617291483997",
  appId: "1:617291483997:web:e3114cc5c5fa03d9d7b6b4",
  measurementId: "G-57VGM61EY8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const storage = getStorage(app);
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

export const registerUser =(username, email, password, setSuccess, setError) => {
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
  const usercollref = doc(db,'users', userId)
  updateDoc(usercollref,{
    isPremium, 
    subscription,
    subDate
  } ).then(response => {
    //alert("updated")
  }).catch(error =>{
    //console.log(error.message)
  })
}

/*export const getUser = async (userId, setUserData) => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return setUserData(userDoc.data())
  }
  return;
};*/

export const getUser = async (userId, setUserData) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    setUserData(userDoc.data());
  } else {
    console.error("User not found");
  }
};


export const getAllusers= async (setUsers, setLoading) => {
  setLoading(true);
  const usersCollectionRef = collection(db, "users");


  const users = [];
  await getDocs(usersCollectionRef).then((data) => {
    data.forEach((doc) => {
      users.push({id: doc.id,...doc.data()});
    });
  }).then(() => {
    setUsers(users);
    setLoading(false);
  }).catch(err => setLoading(false));
};

export const getNews= async (pagination, category, setNews, setLoading) => {
  setLoading(true);
  const newsCollectionRef = collection(db, "news");
  var q = query(newsCollectionRef, orderBy("timestamp", "desc"), limit(pagination));
  if(category !== 'all'){
    q = query(newsCollectionRef, where('category', '==', category), orderBy("timestamp", "desc"), limit(pagination));
  }
  
  const news = [];
  await getDocs(q).then((data) => {
    data.forEach((doc) => {
     news.push({id: doc.id,...doc.data()});
    });
  }).then(() => {
    setNews(news);
    setLoading(false);
  }).catch(err => setLoading(false));
};

export const getNewsItem = async (newsId, setNewsItem, setLoading) => {
  setNewsItem(null);
  setLoading(true);
  const newsDocRef = doc(db, "news", newsId);
  const newsDoc = await getDoc(newsDocRef);
  if (newsDoc.exists()) {
    setNewsItem({id: newsDoc.id, ...newsDoc.data()})
  }
  setLoading(false);
  return;
};

export const addNewsViews = async (newsId) => {
  const newsDocRef = doc(db, "news", newsId);
  const newsDoc = await getDoc(newsDocRef);
  if (newsDoc.exists()) {
    try {
      await updateDoc(newsDocRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }
  return;
};

export const addContact = async (data, setSuccess, setError) => {
  const contactsDocRef = collection(db, "contacts");
  await addDoc(contactsDocRef, {...data, responded: false}).then(async (userCredential) => {
    setSuccess("We will get back to you as soon as possible.")
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setError(errorMessage);
  });
};

export const addMailList = async (data, setSuccess, setError) => {
  const mailDocRef = doc(db, "mail-list", data.email);
  const mailDoc = await getDoc(mailDocRef);
  if (mailDoc.exists()) {
    return setError("The email already exists! Try a new one");
  }
  await setDoc(mailDocRef, {...data}).then(async (response) => {
    setSuccess("You are now subscribe to our newsletter.")
  }).catch(async (error) => {
    const errorMessage = await error.message;
    setError(errorMessage);
  });
  return;
};

export const addPhone = async (data) => {
  const phoneDocRef = doc(db, "phone-numbers", data.phone);
  const phoneDoc = await getDoc(phoneDocRef);
  if (phoneDoc.exists()) {
    return;
  }
  await setDoc(phoneDocRef, {...data}).then(async (response) => {
  }).catch(async (error) => {
    return;
  });
};

export  const addTip = async (data, setError, setLoading) => {
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

export  const updateTip = async (id, data, setError, setLoading, setData) => {
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

export  const addNews = async (data, setError, setLoading) => {
  setLoading(true);
  const newsDocRef = collection(db, "news");
  if (data.image) {
    const imageRef = ref(storage, `blogs/${data.image.name.split(" ").join("_")}`);
    const metadata = {
        contentType: 'blogs/jpeg',
    };
    await uploadBytes(imageRef, data.image, metadata).then((response) => {
      return getDownloadURL(response.ref);
    }).then(async(downloadURL) => {
      await addDoc(newsDocRef, {
        title: data.title,
        description: data.description,
        category: data.category,
        imageUrl: downloadURL,
        timestamp: new Date().toLocaleDateString()
      }).then(async (docRef) => {
        window.location.replace(`/blogs/${docRef.id}`);
      }).catch(async (error) => {
        setError(error.message);
        setLoading(false);
      });
    })
  } else {
    setError('Please upload an image')
    setLoading(false);
  };
  
};

export const getTips= async (pagination, setTips, setLoading, currentDate) => {
  setLoading(true);
  const tipsCollectionRef = collection(db, "tips");
  var q = query(tipsCollectionRef,where("date", "==", currentDate), limit(pagination));

  const tips = [];
  await getDocs(q).then((data) => {
    data.forEach((doc) => {
      tips.push({id: doc.id,...doc.data()});
    });
  }).then(() => {
    setTips(tips);
    setLoading(false);
  }).catch(err => setLoading(false));
};

export const getAllTips= async (setTips, setLoading) => {
  setLoading(true);
  const tipsCollectionRef = collection(db, "tips");
  var q = query(tipsCollectionRef, orderBy("date"));

  const tips = [];
  await getDocs(q).then((data) => {
    data.forEach((doc) => {
      tips.push({id: doc.id,...doc.data()});
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