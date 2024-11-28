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

  /*useEffect(() => {
    if(userData){
      if(userData.subDate === (new Date().toLocaleDateString())){
        updateUser(currentUser.email, false, null, null) 
      }
    }
  }, [userData])*/
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