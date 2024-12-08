import { Routes, Route} from "react-router-dom";
import { HelmetProvider} from "react-helmet-async";
import { useEffect, useState, useContext} from 'react';
import { AuthContext } from './AuthContext'
import { getUser, updateUser } from "./firebase";


import Topbar from "./components/Topbar/Topbar";
import Navbar from './components/Navbar/Navbar';
import Loader from './components/Loader/Loader';
import Footer from './components/Footer/Footer';

import Home from './pages/Home';
import Tips from "./pages/Tips";
import News from './pages/News';
import SingleNews from './pages/SingleNews';
import About from './pages/About';

import Admin from './pages/Admin';
import AdminTips from "./pages/AdminTips";
import { Login } from "./pages/Login";
import Register from "./pages/Register";
import Error from './pages/Error';
import Payments from "./pages/Payments/Payments";
import EditTip from "./pages/EditTip";
import UserProfile from "./pages/userProfile/UserProfile";
import ListUsers from "./pages/ListUsers";


function App() {
  const [loading, setLoading] = useState(false);
  const { currentUser} = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    if(loading){
      if (window.document.readyState === "complete"){
        setLoading(!loading)
      } else {
        setLoading(false);
      }
    }
  }, [loading]);

  useEffect(() => {
    currentUser && getUser(currentUser.email, setUserData)
  }, [currentUser])

  useEffect(() => {
    if (userData && userData.isPremium) {
      const currentTime = new Date(); // Current time
      const previousTime = new Date(userData.subDate); // Assuming userData.subDate is the subscription start date
      const { subscription } = userData; // Get subscription type
  
      const timeDifference = currentTime - previousTime;
  
      // Helper function to update user if time limit has passed
      const checkTimeAndUpdate = (timeLimitInMs) => {
        if (timeDifference >= timeLimitInMs) {
          updateUser(currentUser.email, false, null, null);
        }
      };
  
      switch (subscription) {
        case "Daily":
          checkTimeAndUpdate(24 * 60 * 60 * 1000); // 24 hours in milliseconds
          break;
  
        case "Weekly":
          checkTimeAndUpdate(7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
          break;
  
        case "Monthly":
          // Check if a month has passed
          if (currentTime.getFullYear() > previousTime.getFullYear() || 
              (currentTime.getFullYear() === previousTime.getFullYear() && currentTime.getMonth() > previousTime.getMonth())) {
            updateUser(currentUser.email, false, null, null);
          }
          break;
  
        case "Yearly":
          // Check if a year has passed
          if (currentTime.getFullYear() > previousTime.getFullYear() || 
              (currentTime.getFullYear() === previousTime.getFullYear() && currentTime.getMonth() > previousTime.getMonth()) || 
              (currentTime.getFullYear() === previousTime.getFullYear() && currentTime.getMonth() === previousTime.getMonth() && currentTime.getDate() > previousTime.getDate())) {
            updateUser(currentUser.email, false, null, null);
          }
          break;
  
        default:
          return;
      }
    }
  }, [userData]);
  
  return (
    <HelmetProvider>
    <div className="App">
      {
        loading&& <Loader />
      }
      {
      !loading && <>
      <Topbar/>
      <Navbar />
      <Routes>
          <Route path='/' element={<Home />} />
          <Route path='tips' element={<Tips userData={userData}/>} />
          <Route path='pay' element={currentUser ? <Payments /> : <Login />}  />
          <Route path='blogs' element={<News />} />
          <Route path='blogs/:id' element={<SingleNews />} />
          <Route path='admin' element={currentUser ? <Admin /> : <Login />}  />
          <Route path='admin/tips' element={currentUser ? <AdminTips /> : <Login />}  />
          <Route path='edit' element={currentUser ? <EditTip /> : <Login />}  />
          <Route path='users' element={currentUser ? <ListUsers /> : <Login />}  />
          <Route path='users/:id' element={currentUser ? <UserProfile data={userData}/> : <Login />}  />
          <Route path='about' element={<About />} />
          <Route path='*' element={<Error />} />
          <Route path='login' element={<Login />} />
          <Route path='register' element={<Register />} />
          
      </Routes>
      <Footer user={currentUser}/>
      </>
      }
    </div>
    
    </HelmetProvider>
  );
}
export default App;