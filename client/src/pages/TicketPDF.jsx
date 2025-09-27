// TicketPDF.jsx
import React from 'react';

const TicketPDF = ({ ticket }) => {
  if (!ticket || !ticket.location) return null;

  return (
    <div className="bg-gray-950 p-10 font-sans text-white w-[1200px] h-[600px] flex items-center justify-center">
      <div className="w-[1000px] h-[500px] bg-gray-900 rounded-2xl shadow-2xl flex relative overflow-hidden">
        {/* Left Section (Details) */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <h1 className="text-5xl font-extrabold text-yellow-400 tracking-wide mb-2">
            {ticket.ticketDetails.eventname.toUpperCase()}
          </h1>
          <p className="text-xl text-gray-400 mb-8">{ticket.ticketDetails.eventdate}, {ticket.ticketDetails.eventtime}</p>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xl">
            <div>
              <p className="text-gray-400">Holder Name:</p>
              <p className="font-extrabold">{ticket.ticketDetails.name.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-gray-400">Email:</p>
              <p className="font-extrabold">{ticket.ticketDetails.email}</p>
            </div>
            <div>
              <p className="text-gray-400">Price:</p>
              <p className="font-extrabold text-green-400">{ticket.ticketDetails.ticketprice === 0 ? 'FREE' : `${ticket.ticketDetails.ticketprice} TND`}</p>
            </div>
            <div>
              <p className="text-gray-400">Location:</p>
              <p className="font-extrabold text-white">{ticket.location}</p>
            </div>
          </div>
        </div>

        {/* Right Section (QR Code) */}
        <div className="w-[400px] bg-gray-800 flex items-center justify-center border-l-4 border-yellow-400 relative">
          <div className="p-4 bg-white rounded-xl shadow-lg">
            <img src={ticket.ticketDetails.qr} alt="QR Code" className="w-64 h-64" />
          </div>
          <p className="absolute bottom-6 text-sm text-gray-400">Scan to validate ticket</p>
        </div>
      </div>
    </div>
  );
};

export default TicketPDF;