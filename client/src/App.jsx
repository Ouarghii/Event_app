/* eslint-disable no-unused-vars */
import { Route, Routes } from 'react-router-dom'
import './App.css'
import IndexPage from './pages/IndexPage'
import RegisterPage from './pages/RegisterPage'
import Layout from './Layout'
import LoginPage from './pages/LoginPage'
import axios from 'axios'
import { UserContextProvider } from './UserContext'
import UserAccountPage from './pages/UserAccountPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AddEvent from './pages/AddEvent'
import EventPage from './pages/EventPage'
import CalendarView from './pages/CalendarView'
import OrderSummary from './pages/OrderSummary'
import PaymentSummary from './pages/PaymentSummary'
import TicketPage from './pages/TicketPage'
import CreatEvent from './pages/CreateEvent'
import RoleSelectionPage from "./pages/RoleSelectionPage";
import ContributorRegisterPage from './pages/ContributorRegisterPage';
import ContributorLoginPage from './pages/ContributorLoginPage';
import AdminRegisterPage from './pages/AdminRegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import Categories from './pages/categories'
import ProtectedRoute from './ProtectedRoute'; 
import AdminDashboard from './pages/AdminDashboard'; 
import ProfilePage from './pages/ProfilePage'
import ProfileDetails from './pages/ProfileDetails'
import ContributorDashboard from './pages/ContributorDashboard'


axios.defaults.baseURL = 'http://localhost:4000/';
axios.defaults.withCredentials=true;

function App() {
  return (
    <UserContextProvider> 
    <Routes>
            
      <Route path='/' element={<Layout />}>
        <Route index element = {<IndexPage />} />
        <Route path='/useraccount' element = {<UserAccountPage />}/>
        <Route element={<ProtectedRoute allowedRoles={['contributor', 'admin']} />}>
            <Route path='/createEvent' element = {<AddEvent/>} />
        </Route>
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/contributordashboard" element={<ContributorDashboard/>} />

        <Route path='/event/:id' element= {<EventPage/>} />
        <Route path='/calendar' element={<CalendarView />} />
        <Route path='/wallet' element={<TicketPage />}/>
        <Route path='/event/:id/ordersummary' element = {<OrderSummary />} />
        <Route path='/event/:id/ordersummary/paymentsummary' element = {<PaymentSummary />} />
        <Route path="/select-role" element={<RoleSelectionPage />} /> 
        <Route path="/categories" element={<Categories />} />
        <Route path="/profileedit" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfileDetails />} />

      </Route>

      <Route path='/register' element={<RegisterPage />}/>
      <Route path='/login' element={<LoginPage />}/>
      <Route path='/forgotpassword' element = {<ForgotPassword/>} />
      <Route path='/resetpassword' element = {<ResetPassword/>} />
          {/* 🟢 NEW CONTRIBUTOR ROUTES */}
        <Route path="/contributor/register" element={<ContributorRegisterPage />} />
        <Route path="/contributor/login" element={<ContributorLoginPage />} />

        {/* 🟢 NEW ADMIN ROUTES */}
        <Route path="/admin/register" element={<AdminRegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

      
      
    
    </Routes>
    </UserContextProvider>  
  )
}

export default App
