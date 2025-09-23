import { useContext, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext';
import logo from '../assets/logo.png'; // Assuming a logo asset

export default function AddEvent() {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState({
    owner: user ? user.name : "",
    title: "",
    optional: "",
    description: "",
    organizedBy: "",
    eventDate: "",
    eventTime: "",
    location: "",
    ticketPrice: 0,
    image: '',
    likes: 0
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prevState) => ({ ...prevState, image: file }));
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prevState) => ({ ...prevState, [name]: files[0] }));
    } else {
      setFormData((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("/createEvent", formData)
      .then((response) => {
        console.log("Event posted successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error posting event:", error);
      });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-center items-center p-6">
      {/* Outer container with a dark background and full screen height */}
<div className="w-full max-w-4xl bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 animate-fade-in-up">
        
        {/* Header with logo and title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-wider glow-text">Post an Event</h1>
          <p className="mt-2 text-gray-400">Bring your community together. Fill out the details below.</p>
        </div>

        {/* Form Section with a grid layout */}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Map through form inputs for a cleaner structure */}
          {[
            { label: "Event Title", name: "title", type: "text" },
            { label: "Optional Info", name: "optional", type: "text" },
            { label: "Organized By", name: "organizedBy", type: "text" },
            { label: "Location", name: "location", type: "text" },
            { label: "Event Date", name: "eventDate", type: "date" },
            { label: "Event Time", name: "eventTime", type: "time" },
            { label: "Ticket Price", name: "ticketPrice", type: "number" }
          ].map(({ label, name, type }) => (
            <div key={name} className="relative z-0 w-full group">
              <input
                type={type}
                name={name}
                id={name}
                className="peer w-full py-3 px-0 text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 transition-colors duration-300"
                placeholder=" "
                value={formData[name]}
                onChange={handleChange}
                required
              />
              <label
                htmlFor={name}
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                {label}
              </label>
            </div>
          ))}

          {/* Description field spans full width on desktop */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea
              name="description"
              id="description"
              rows="4"
              className="w-full p-4 text-white bg-gray-800 rounded-lg border border-gray-700 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow duration-300"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell people about your event..."
            ></textarea>
          </div>

          {/* Image upload section with a custom dropzone-like design */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">Image</label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-300 group hover:scale-[1.01] shadow-lg"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-gray-500 group-hover:text-yellow-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-400 group-hover:text-white"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF</p>
                </div>
                <input id="image" type="file" name="image" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {formData.image && typeof formData.image === 'object' && (
              <img
                src={URL.createObjectURL(formData.image)}
                alt="Preview"
                className="mt-6 rounded-lg w-full h-64 object-cover shadow-xl border border-gray-700"
              />
            )}
          </div>

          {/* Submit button spans full width */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-[1.01] shadow-md"
            >
              Submit Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}