// TicketPage.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoMdArrowBack } from 'react-icons/io';
import { RiDeleteBinLine } from 'react-icons/ri';
import { AiOutlineDownload } from "react-icons/ai";
import axios from "axios";
import { UserContext } from "../UserContext";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TicketPDF from "./TicketPDF";
import ReactDOM from 'react-dom/client';

export default function TicketPage() {
    const { user } = useContext(UserContext);
    const [userTickets, setUserTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventLocations, setEventLocations] = useState({});

    useEffect(() => {
        if (user) {
            fetchTickets();
        }
    }, [user]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const ticketsResponse = await axios.get(`/tickets/user/${user._id}`);
            const tickets = ticketsResponse.data;
            setUserTickets(tickets);

            const locations = {};
            const locationPromises = tickets.map(ticket =>
                axios.get(`/event/${ticket.eventid}`).then(response => {
                    locations[ticket.eventid] = response.data.location;
                }).catch(eventError => {
                    console.error(`Error fetching location for event ${ticket.eventid}:`, eventError);
                    locations[ticket.eventid] = "Location Not Found";
                })
            );

            await Promise.all(locationPromises);
            setEventLocations(locations);

        } catch (error) {
            console.error('Error fetching user tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteTicket = async (ticketId) => {
        if (window.confirm("Are you sure you want to delete this ticket?")) {
            try {
                await axios.delete(`/tickets/${ticketId}`);
                fetchTickets();
                alert('Ticket Deleted');
            } catch (error) {
                console.error('Error deleting ticket:', error);
            }
        }
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hour, minute] = time.split(':');
        const formattedHour = parseInt(hour, 10);
        const ampm = formattedHour >= 12 ? 'PM' : 'AM';
        const displayHour = formattedHour % 12 || 12;
        return `${displayHour}:${minute} ${ampm}`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    };

    const downloadTicketAsPDF = async (ticket) => {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        document.body.appendChild(tempContainer);

        const root = ReactDOM.createRoot(tempContainer);
        const ticketWithLocation = { ...ticket, location: eventLocations[ticket.eventid] };
        root.render(<TicketPDF ticket={ticketWithLocation} />);

        await new Promise(requestAnimationFrame);

        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', [300, 150]);
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${ticket.ticketDetails.eventname}_ticket.pdf`);

        document.body.removeChild(tempContainer);
        root.unmount();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">
                <div className="animate-pulse text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 animate-fade-in">
            <Link to="/" className="inline-block mb-8 md:mb-12">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-yellow-400 font-bold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 hover:bg-gray-700">
                    <IoMdArrowBack className="w-5 h-5" />
                    Back
                </button>
            </Link>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 md:mb-12 text-center">Your Tickets</h1>

            {userTickets.length === 0 ? (
                <div className="text-center text-gray-400 text-xl mt-20">
                    You don't have any tickets yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {userTickets.map(ticket => (
                        <div
                            key={ticket._id}
                            className="relative p-6 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-yellow-500/10"
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 bg-white rounded-lg aspect-square shadow-inner">
                                        <img
                                            src={ticket.ticketDetails.qr}
                                            alt="QR Code"
                                            className="w-32 h-32 object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={() => downloadTicketAsPDF(ticket)}
                                        className="flex items-center justify-center gap-2 mt-2 text-sm font-bold text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                                    >
                                        <AiOutlineDownload className="w-5 h-5" />
                                        Download PDF
                                    </button>
                                </div>
                                <div className="flex-grow text-sm md:text-base space-y-3">
                                    <h3 className="text-xl font-extrabold text-yellow-400">
                                        {ticket.ticketDetails.eventname.toUpperCase()}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div>
                                            <p className="text-gray-400">Date & Time:</p>
                                            <p className="font-extrabold">{formatDate(ticket.ticketDetails.eventdate)}, {formatTime(ticket.ticketDetails.eventtime)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Location:</p>
                                            <p className="font-extrabold">{eventLocations[ticket.eventid] || 'Loading...'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-400">Name:</p>
                                            <p className="font-extrabold">{ticket.ticketDetails.name.toUpperCase()}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-400">Email:</p>
                                            <p className="font-extrabold">{ticket.ticketDetails.email}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-400">Price:</p>
                                            <p className="font-extrabold text-green-400">{ticket.ticketDetails.ticketprice === 0 ? 'FREE' : ` ${ticket.ticketDetails.ticketprice} TND`}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteTicket(ticket._id)}
                                    className="absolute top-4 right-4 text-red-500 hover:text-red-400 transition-colors duration-200 transform hover:scale-110"
                                >
                                    <RiDeleteBinLine className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}