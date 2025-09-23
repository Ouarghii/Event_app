import axios from 'axios';
import { useEffect, useState } from 'react';
import { IoMdArrowBack } from "react-icons/io";
import { Link, useParams } from 'react-router-dom';

export default function OrderSummary() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  // Fetch event by ID
  useEffect(() => {
    if (!id) return;
    axios.get(`/event/${id}/ordersummary`)
      .then(response => {
        setEvent(response.data);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });
  }, [id]);

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    setIsCheckboxChecked(e.target.checked);
  };

  if (!event) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 animate-fade-in">
      {/* Back Button */}
      <Link to={`/event/${event._id}`} className="inline-block mb-8 md:mb-12">
        <button
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-yellow-400 font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-gray-700"
        >
          <IoMdArrowBack className="w-5 h-5" />
          Back
        </button>
      </Link>

      {/* Main Container Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Terms & Conditions Section */}
        <div className="lg:col-span-2 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 animate-slide-in-up">
          <h2 className="text-3xl font-extrabold text-white mb-6">Terms & Conditions</h2>
          <div className="text-gray-300 space-y-4">
            <ul className="list-disc list-inside space-y-4">
              <li>
                <span className="font-bold text-white">Refund Policy:</span> Refunds will be provided for ticket cancellations made up to 14 days before the event date. After this period, no refunds will be issued.
              </li>
              <li>
                <span className="font-bold text-white">Ticket Delivery:</span> Tickets will be delivered to your registered email address as e-tickets. You can print the e-ticket or show it on your mobile device for entry to the event.
              </li>
              <li>
                <span className="font-bold text-white">Purchase Limit:</span> Each individual is allowed to purchase a maximum of 2 tickets for this event to ensure fair distribution.
              </li>
              <li>
                <span className="font-bold text-white">Event Changes:</span> In the rare event of cancellation or postponement, attendees will be notified via email. Refunds will be automatically processed for canceled events.
              </li>
              <li>
                <span className="font-bold text-white">Postponed Events:</span> Tickets for postponed events will not be refunded and the ticket will be considered a valid ticket on the date of postponement.
              </li>
              <li>
                <span className="font-bold text-white">Privacy Policy:</span> Your privacy is important to us. Our privacy policy outlines how we collect, use, and protect your personal information. By using our app, you agree to our privacy policy.
              </li>
              <li>
                <span className="font-bold text-white">Acceptance:</span> Before proceeding with your ticket purchase, please review and accept our terms and conditions, which govern the use of our app and ticketing services.
              </li>
            </ul>
          </div>
        </div>

        {/* Booking Summary Section */}
        <div className="lg:col-span-1 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 flex flex-col justify-between animate-slide-in-up delay-200">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-6">Booking Summary</h2>
            <div className="flex justify-between items-center text-gray-300 mb-4">
              <span className="text-lg">{event.title}</span>
              <span className="text-lg font-bold">{event.ticketPrice} TND</span>
            </div>
            <hr className="my-4 border-gray-700" />
            <div className="flex justify-between items-center text-yellow-400 font-extrabold text-2xl mb-6">
              <span>SUB TOTAL</span>
              <span>{event.ticketPrice} TND</span>
            </div>
          </div>

          <div className="mt-8">
            {/* Checkbox and Label */}
            <label className="flex items-start cursor-pointer group mb-6">
              <input
                type="checkbox"
                checked={isCheckboxChecked}
                onChange={handleCheckboxChange}
                className="
                  w-5 h-5 mr-3 mt-1
                  accent-yellow-500 rounded-md
                  transform transition-all duration-200
                  group-hover:scale-110
                  focus:ring-yellow-500
                "
              />
              <span className="text-sm text-gray-400">
                I have verified the Event name, date and time before proceeding to payment. I accept terms and conditions.
              </span>
            </label>

            {/* Proceed Button */}
            <Link to={`/event/${event._id}/ordersummary/paymentsummary`}>
              <button
                className={`
                  w-full px-8 py-4
                  rounded-lg font-bold shadow-md
                  transition-all duration-300 transform
                  ${isCheckboxChecked
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 hover:scale-[1.01]'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }
                `}
                disabled={!isCheckboxChecked}
              >
                Proceed to Payment
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}