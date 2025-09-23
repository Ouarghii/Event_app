/* eslint-disable no-unused-vars */
import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { IoMdArrowBack } from 'react-icons/io';
import { UserContext } from '../UserContext';
import Qrcode from 'qrcode';
import { HiOutlineUser, HiOutlineMail, HiOutlineDeviceMobile, HiOutlineCreditCard, HiOutlineCalendar, HiOutlineLockClosed } from 'react-icons/hi';

export default function PaymentSummary() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const { user } = useContext(UserContext);
  const [details, setDetails] = useState({
    name: '',
    email: '',
    contactNo: '',
  });

  const defaultTicketState = {
    userid: user ? user._id : '',
    eventid: '',
    ticketDetails: {
      name: user ? user.name : '',
      email: user ? user.email : '',
      eventname: '',
      eventdate: '',
      eventtime: '',
      ticketprice: '',
      qr: '',
    },
  };

  const [ticketDetails, setTicketDetails] = useState(defaultTicketState);
  const [payment, setPayment] = useState({
    nameOnCard: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [redirect, setRedirect] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`/event/${id}/ordersummary/paymentsummary`)
      .then(response => {
        setEvent(response.data);
        setTicketDetails(prevTicketDetails => ({
          ...prevTicketDetails,
          eventid: response.data._id,
          ticketDetails: {
            ...prevTicketDetails.ticketDetails,
            eventname: response.data.title,
            eventdate: response.data.eventDate.split("T")[0],
            eventtime: response.data.eventTime,
            ticketprice: response.data.ticketPrice,
          },
        }));
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, [id]);

  useEffect(() => {
    setTicketDetails(prevTicketDetails => ({
      ...prevTicketDetails,
      userid: user ? user._id : '',
      ticketDetails: {
        ...prevTicketDetails.ticketDetails,
        name: user ? user.name : '',
        email: user ? user.email : '',
      },
    }));
  }, [user]);

  if (!event) return '';

  const handleChangeDetails = (e) => {
    const { name, value } = e.target;
    setDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleChangePayment = (e) => {
    const { name, value } = e.target;
    setPayment((prevPayment) => ({
      ...prevPayment,
      [name]: value,
    }));
  };

  const createTicket = async (e) => {
    e.preventDefault();

    try {
      const qrCode = await generateQRCode(
        ticketDetails.ticketDetails.eventname,
        ticketDetails.ticketDetails.name
      );

      const updatedTicketDetails = {
        ...ticketDetails,
        ticketDetails: {
          ...ticketDetails.ticketDetails,
          qr: qrCode,
        },
      };

      const response = await axios.post(`/tickets`, updatedTicketDetails);
      alert("Ticket Created");
      setRedirect(true);
      console.log('Success creating ticket', updatedTicketDetails);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  async function generateQRCode(name, eventName) {
    try {
      const qrCodeData = await Qrcode.toDataURL(
        `Event Name: ${name} \n Name: ${eventName}`
      );
      return qrCodeData;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return null;
    }
  }

  if (redirect) {
    return <Navigate to={'/wallet'} />;
  }

  const InputWithLabel = ({ name, label, type, icon, value, onChange, disabled }) => (
    <div className="relative z-0 group w-full">
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder=" "
        className="block w-full px-4 py-3 text-sm text-white bg-gray-800 rounded-lg appearance-none focus:outline-none focus:ring-0 peer transition-all duration-300 transform scale-100 placeholder-transparent"
      />
      <label
        htmlFor={name}
        className="absolute text-sm text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-4 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
      >
        {label}
      </label>
      {icon && <div className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 peer-focus:text-yellow-400 transition-colors duration-300">{icon}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 animate-fade-in">
      <Link to={`/event/${event._id}/ordersummary`} className="inline-block mb-8 md:mb-12">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-yellow-400 font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-gray-700">
          <IoMdArrowBack className="w-5 h-5" />
          Back
        </button>
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 w-full max-w-7xl mx-auto">
        <div className="lg:col-span-2 p-1 border-4 border-transparent rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl animate-slide-in-up">
          <div className="bg-gray-950 rounded-[1.2rem] p-8">
            <form onSubmit={createTicket} className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-white">Your Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <InputWithLabel
                    name="name"
                    label="Full Name"
                    type="text"
                    icon={<HiOutlineUser className="w-5 h-5" />}
                    value={user ? user.name : details.name}
                    onChange={handleChangeDetails}
                    disabled={!!user}
                  />
                  <InputWithLabel
                    name="email"
                    label="Email Address"
                    type="email"
                    icon={<HiOutlineMail className="w-5 h-5" />}
                    value={user ? user.email : details.email}
                    onChange={handleChangeDetails}
                    disabled={!!user}
                  />
                </div>
                <InputWithLabel
                  name="contactNo"
                  label="Contact Number"
                  type="tel"
                  icon={<HiOutlineDeviceMobile className="w-5 h-5" />}
                  value={details.contactNo}
                  onChange={handleChangeDetails}
                />
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-extrabold text-white">Payment Option</h2>
                <div className="space-y-6 p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg transition-colors duration-300"
                      disabled
                    >
                      Credit / Debit Card
                    </button>
                    <span className="text-sm text-gray-400">Secure Payment</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputWithLabel
                      name="nameOnCard"
                      label="Name on Card"
                      type="text"
                      icon={<HiOutlineUser className="w-5 h-5" />}
                      value={payment.nameOnCard}
                      onChange={handleChangePayment}
                    />
                    <InputWithLabel
                      name="cardNumber"
                      label="Card Number"
                      type="text"
                      icon={<HiOutlineCreditCard className="w-5 h-5" />}
                      value={payment.cardNumber}
                      onChange={handleChangePayment}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputWithLabel
                      name="expiryDate"
                      label="Expiry Date (MM/YY)"
                      type="text"
                      icon={<HiOutlineCalendar className="w-5 h-5" />}
                      value={payment.expiryDate}
                      onChange={handleChangePayment}
                    />
                    <InputWithLabel
                      name="cvv"
                      label="CVV"
                      type="text"
                      icon={<HiOutlineLockClosed className="w-5 h-5" />}
                      value={payment.cvv}
                      onChange={handleChangePayment}
                    />
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row justify-end items-center gap-6">
                  <div className="flex items-center gap-4">
                    <p className="text-xl font-semibold text-gray-400">Total:</p>
                    <p className="text-3xl font-bold text-yellow-400">{event.ticketPrice} TND</p>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 bg-yellow-500 text-gray-950 font-extrabold rounded-lg shadow-lg hover:bg-yellow-400 transition-all duration-300 transform hover:scale-105"
                  >
                    Make Payment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 flex flex-col justify-between animate-slide-in-up delay-200">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-gray-400">
                <p>1 Ticket</p>
                <p className="font-semibold text-white">{event.ticketPrice} TND</p>
              </div>
              <p className="text-xl font-bold text-yellow-400">{event.title}</p>
              <p className="text-sm text-gray-400">{event.eventDate.split("T")[0]}</p>
              <p className="text-sm text-gray-400">{event.eventTime}</p>
              <hr className="my-4 border-gray-700" />
              <div className="flex justify-between items-center text-yellow-400 font-extrabold text-2xl">
                <span>Sub total:</span>
                <span>{event.ticketPrice} TND</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}