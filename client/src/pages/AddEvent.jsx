import { useContext, useState } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext';

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
    likes: 0,
    category: ""
  });

  const categories = [
    { value: 'Community', label: 'Community' },
    { value: 'Networking & Development', label: 'Networking & Development' },
    { value: 'Engineering & Business', label: 'Engineering & Business' },
    { value: 'Innovation & Cybersecurity', label: 'Innovation & Cybersecurity' },
    { value: 'Compliance & Emerging Technologies & Corporate', label: 'Compliance & Emerging Technologies & Corporate' },
    { value: 'Enterprise IT & Education', label: 'Enterprise IT & Education' },
    { value: 'Research & Global Tech Trends', label: 'Research & Global Tech Trends' }
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("/createEvent", formData)
      .then(res => console.log("Event posted:", res.data))
      .catch(err => console.error("Error:", err));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-4xl bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-white tracking-wider glow-text">Post an Event</h1>
          <p className="mt-2 text-gray-400">Bring your community together. Fill out the details below.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Text Inputs with Floating Labels */}
          {[
            { label: "Event Title", name: "title", type: "text", required: true },
            { label: "Optional Info", name: "optional", type: "text", required: false },
            { label: "Organized By", name: "organizedBy", type: "text", required: true },
            { label: "Location", name: "location", type: "text", required: true },
            { label: "Event Date", name: "eventDate", type: "date", required: true },
            { label: "Event Time", name: "eventTime", type: "time", required: true },
            { label: "Ticket Price ($)", name: "ticketPrice", type: "number", required: true }
          ].map(({ label, name, type, required }) => (
            <div key={name} className="relative z-0 w-full group">
              <input
                type={type}
                name={name}
                id={name}
                value={formData[name]}
                onChange={handleChange}
                className="block py-3 px-0 w-full text-white bg-transparent border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer"
                placeholder=" "
                required={required}
              />
              <label
                htmlFor={name}
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-400 peer-focus:scale-75 peer-focus:-translate-y-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2"
              >
                {label}
              </label>
            </div>
          ))}

          <div className="relative z-0 w-full group">
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="block w-full text-white bg-gray-950 border-0 border-b-2 border-gray-600 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-400 peer pt-4 pb-3 px-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" disabled hidden className="bg-gray-900 text-white">Select a category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value} className="bg-gray-900 text-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <label
              htmlFor="category"
              className="absolute text-sm text-gray-400 duration-300 transform -translate-y-6 scale-75 top-1 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-400 peer-focus:scale-75 peer-focus:-translate-y-6 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-3 peer-placeholder-shown:-translate-y-0"
            >
              Category *
            </label>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell people about your event..."
              className="w-full p-4 text-white bg-gray-800 rounded-lg border border-gray-700 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow duration-300"
              required
            ></textarea>
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Event Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors duration-300 group"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-400 group-hover:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-400 group-hover:text-white">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-300">PNG, JPG, JPEG (MAX. 10MB)</p>
                </div>
                <input 
                  id="image" 
                  type="file" 
                  name="image" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </label>
            </div>
            {formData.image && typeof formData.image === 'object' && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Image Preview:</p>
                <img 
                  src={URL.createObjectURL(formData.image)} 
                  alt="Preview" 
                  className="rounded-lg w-full h-64 object-cover shadow-xl border border-gray-700" 
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-300 transform hover:scale-105 active:scale-95"
            >
              Submit Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}