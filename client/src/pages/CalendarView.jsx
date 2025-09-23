import axios from "axios";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameDay, isToday } from "date-fns";
import { useEffect, useState } from "react";
import { BsCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import { Link } from "react-router-dom";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);

  // Fetch events from the server
  useEffect(() => {
    axios.get("/events").then((response) => {
      setEvents(response.data);
    }).catch((error) => {
      console.error("Error fetching events:", error);
    });
  }, []);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Create an array of empty cells to align days correctly
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, index) => (
    <div key={`empty-${index}`} className="p-2 border-b border-r border-gray-800 dark:bg-gray-800"></div>
  ));

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-5xl bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 p-8 animate-fade-in-up">
        
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between mb-8 px-4 py-3 rounded-lg bg-gray-800 shadow-inner">
          <button
            className="p-2 rounded-full text-yellow-400 hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            onClick={() => setCurrentMonth((prevMonth) => addMonths(prevMonth, -1))}
          >
            <BsCaretLeftFill className="w-6 h-6" />
          </button>
          <span className="text-3xl font-extrabold text-white tracking-wide glow-text">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            className="p-2 rounded-full text-yellow-400 hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            onClick={() => setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))}
          >
            <BsFillCaretRightFill className="w-6 h-6" />
          </button>
        </div>

        {/* Days of the Week Header */}
        <div className="grid grid-cols-7 text-center font-bold text-yellow-400 text-lg mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-3 bg-gray-800 border-b-2 border-gray-700 shadow-sm">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-t border-l border-gray-800">
          {emptyCells.concat(daysInMonth.map((date) => {
            const dayEvents = events.filter((event) =>
              format(new Date(event.eventDate), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            );

            const isCurrentDay = isToday(date);
            const isSelectedMonth = isSameDay(date, currentMonth) || date.getMonth() === currentMonth.getMonth();

            return (
              <div
                key={date.toISOString()}
                className={`
                  p-2 relative min-h-[120px] sm:min-h-[150px]
                  border-b border-r border-gray-800 bg-gray-800 text-white
                  flex flex-col items-start justify-start
                  ${!isSelectedMonth ? 'text-gray-500 bg-gray-850' : ''} /* Fade out days not in current month */
                  ${isCurrentDay ? 'bg-yellow-900 bg-opacity-30 border-yellow-500 ring-2 ring-yellow-500 rounded-lg shadow-inner z-10' : ''} /* Highlight today */
                  transition-all duration-200 hover:bg-gray-700
                `}
              >
                <div className={`font-bold text-lg mb-1 ${isCurrentDay ? 'text-yellow-400' : ''}`}>
                  {format(date, "dd")}
                </div>
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                  {dayEvents.map((event) => (
                    <Link
                      key={event._id}
                      to={"/event/" + event._id}
                      className="w-full text-center truncate bg-yellow-600 hover:bg-yellow-500 text-gray-900 rounded-md p-1 font-semibold text-xs transition-colors duration-200 transform hover:scale-[1.02] shadow-md"
                      title={event.title}
                    >
                      {event.title.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}