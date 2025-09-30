const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const UserModel = require("./models/User");
const AdminModel = require("./models/Admin"); 
const ContributorModel = require("./models/Contributor"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");

const Ticket = require("./models/Ticket");

const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "bsbsfbrnsftentwnnwnwn";

app.use(express.json());
app.use(cookieParser());
// --- Allow multiple dev origins dynamically ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173"];
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);


// =================================================================
// 🟢 FIXED ADMIN SEEDING AND DATABASE CONNECTION
// =================================================================
const FIXED_ADMIN_EMAIL = 'admin@admin.com';
const FIXED_ADMIN_NAME = 'Super Admin';
const FIXED_ADMIN_PASSWORD_RAW = '123456'; 

const seedAdminAccount = async () => {
    try {
        const existingAdmin = await AdminModel.findOne({ email: FIXED_ADMIN_EMAIL });
        
        if (!existingAdmin) {
            console.log('Fixed admin account not found. Creating it...');
            
            const hashedPassword = bcrypt.hashSync(FIXED_ADMIN_PASSWORD_RAW, bcryptSalt);
            
            await AdminModel.create({
                name: FIXED_ADMIN_NAME,
                email: FIXED_ADMIN_EMAIL,
                password: hashedPassword,
            });
            console.log('✅ Fixed admin account created successfully!');
        } else {
            console.log('Fixed admin account already exists. Skipping creation.');
        }
    } catch (error) {
        console.error('Error seeding fixed admin account:', error);
    }
};

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log('MongoDB connected.');
        seedAdminAccount(); // Run the seed function after connection
    })
    .catch(err => console.error('MongoDB connection error:', err));
// =================================================================

const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      // 🟢 FIX 1: Use absolute path for robustness
      cb(null, path.join(__dirname, "uploads"));
   },
   filename: (req, file, cb) => {
      // This part is fine, but be aware of overwriting if files have the same name
      cb(null, file.originalname);
   },
});

const upload = multer({ storage });

app.get("/test", (req, res) => {
   res.json("test ok");
});

app.post("/register", async (req, res) => {
   const { name, email, password } = req.body;

   try {
      const userDoc = await UserModel.create({
         name,
         email,
         password: bcrypt.hashSync(password, bcryptSalt),
      });
      res.json(userDoc);
   } catch (e) {
      res.status(422).json(e);
   }
});

app.post("/login", async (req, res) => {
   const { email, password } = req.body;

   const userDoc = await UserModel.findOne({ email });

   if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
   }

   const passOk = bcrypt.compareSync(password, userDoc.password);
   if (!passOk) {
      return res.status(401).json({ error: "Invalid password" });
   }

   jwt.sign(
      {
         email: userDoc.email,
         id: userDoc._id,
      },
      jwtSecret,
      {},
      (err, token) => {
         if (err) {
            return res.status(500).json({ error: "Failed to generate token" });
         }
         res.cookie("token", token).json(userDoc);
      }
   );
});

app.get("/profile", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            
            // 🐛 FIX: Check if the user document exists before destructuring
            const userDoc = await UserModel.findById(userData.id);
            
            if (userDoc) {
                const { name, email, _id } = userDoc;
                res.json({ name, email, _id });
            } else {
                res.json(null); 
            }
        });
    } else {
        res.json(null);
    }
});

app.post("/logout", (req, res) => {
   res.cookie("token", "").json(true);
});

// 🔴 ADMIN REGISTRATION ROUTE IS REMOVED HERE TO ENFORCE SINGLE ADMIN POLICY

// Admin Login
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const adminDoc = await AdminModel.findOne({ email });

    if (!adminDoc) return res.status(404).json({ error: "Admin not found" });

    const passOk = bcrypt.compareSync(password, adminDoc.password);
    if (!passOk) return res.status(401).json({ error: "Invalid password" });

    jwt.sign(
        { email: adminDoc.email, id: adminDoc._id, role: 'admin' }, // 🟢 Role added here
        jwtSecret,
        {},
        (err, token) => {
            if (err) return res.status(500).json({ error: "Failed to generate token" });
            res.cookie("token", token).json(adminDoc);
        }
    );
});

// Admin Profile
app.get("/admin/profile", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) return res.json(null);
            // 🟢 Find by ID in the Admin model
            const { name, email, _id } = await AdminModel.findById(userData.id); 
            res.json({ name, email, _id, role: 'admin' });
        });
    } else {
        res.json(null);
    }
});
app.post("/admin/logout", (req, res) => {
   res.cookie("token", "").json(true);
});


// =================================================================
// 🟢 CONTRIBUTOR ROUTES
// =================================================================

// Contributor Registration
app.post("/contributor/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const contributorDoc = await ContributorModel.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(contributorDoc);
    } catch (e) {
        res.status(422).json({ error: "Contributor registration failed" });
    }
});

// Contributor Login
app.post("/contributor/login", async (req, res) => {
    const { email, password } = req.body;
    const contributorDoc = await ContributorModel.findOne({ email });

    if (!contributorDoc) return res.status(404).json({ error: "Contributor not found" });

    const passOk = bcrypt.compareSync(password, contributorDoc.password);
    if (!passOk) return res.status(401).json({ error: "Invalid password" });

    jwt.sign(
        { email: contributorDoc.email, id: contributorDoc._id, role: 'contributor' }, // 🟢 Role added here
        jwtSecret,
        {},
        (err, token) => {
            if (err) return res.status(500).json({ error: "Failed to generate token" });
            res.cookie("token", token).json(contributorDoc);
        }
    );
});

// Contributor Profile
app.get("/contributor/profile", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) return res.json(null);
            // 🟢 Find by ID in the Contributor model
            const { name, email, _id } = await ContributorModel.findById(userData.id); 
            res.json({ name, email, _id, role: 'contributor' });
        });
    } else {
        res.json(null);
    }
});
app.post("/contributor/logout", (req, res) => {
   res.cookie("token", "").json(true);
});
// Category configuration - MUST MATCH FRONTEND EXACTLY
const CATEGORIES = [
  'Community',
  'Networking & Development',
  'Engineering & Business',
  'Innovation & Cybersecurity',
  'Compliance & Emerging Technologies & Corporate',
  'Enterprise IT & Education',
  'Research & Global Tech Trends'
];

// Updated Event Schema with Category Field
const eventSchema = new mongoose.Schema({
   owner: String,
   title: String,
   optional: String,
   description: String,
   organizedBy: String,
   eventDate: Date,
   eventTime: String,
   location: String,
   Participants: Number,
   Count: Number,
   Income: Number,
   ticketPrice: Number,
   Quantity: Number,
   image: String,
   likes: { type: Number, default: 0 },
   Comment: [String],
   category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      trim: true // Ensure no whitespace
   }
}, { timestamps: true });

const Event = mongoose.model("Event", eventSchema);
// Helper function to normalize category (trim and exact match)
const normalizeCategory = (category) => {
  if (!category) return null;
  
  // Trim and find exact match from CATEGORIES array
  const trimmedCategory = category.trim();
  const exactMatch = CATEGORIES.find(cat => cat === trimmedCategory);
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // If no exact match, try case-insensitive match
  const caseInsensitiveMatch = CATEGORIES.find(cat => 
    cat.toLowerCase() === trimmedCategory.toLowerCase()
  );
  
  return caseInsensitiveMatch || trimmedCategory;
};

// Event endpoints - UPDATED with category normalization
app.post("/createEvent", upload.single("image"), async (req, res) => {
   try {
      const eventData = req.body;
      
      // Normalize and validate category
      if (!eventData.category) {
        return res.status(400).json({ error: "Category is required" });
      }
      
      const normalizedCategory = normalizeCategory(eventData.category);
      if (!CATEGORIES.includes(normalizedCategory)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      eventData.category = normalizedCategory;
      eventData.image = req.file ? `/uploads/${req.file.filename}` : "";
      
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      console.log(`Event created with category: "${eventData.category}"`);
      res.status(201).json(newEvent);
   } catch (error) {
      console.error("Error creating event:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: "Invalid category value" });
      }
      res.status(500).json({ error: "Failed to save the event to MongoDB" });
   }
});

app.get("/createEvent", async (req, res) => {
   try {
      const events = await Event.find().sort({ createdAt: -1 });
      res.status(200).json(events);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch events from MongoDB" });
   }
});

// Get events by category - FIXED VERSION
app.get("/events/category/:category", async (req, res) => {
   try {
      let { category } = req.params;
      
      if (!category) {
        return res.status(400).json({ error: "Category parameter is required" });
      }
      
      // Normalize the category parameter
      const normalizedCategory = normalizeCategory(category);
      console.log('Searching for category:', { original: category, normalized: normalizedCategory });
      
      if (!CATEGORIES.includes(normalizedCategory)) {
        console.log('Invalid category requested:', normalizedCategory);
        return res.status(400).json({ error: "Invalid category" });
      }
      
      // Use exact match with the normalized category
      const events = await Event.find({ category: normalizedCategory }).sort({ createdAt: -1 });
      console.log(`Found ${events.length} events for category: "${normalizedCategory}"`);
      
      // Double-check filtering on the server side
      const filteredEvents = events.filter(event => 
        event.category && event.category.trim() === normalizedCategory
      );
      
      console.log(`After server-side filtering: ${filteredEvents.length} events`);
      
      res.status(200).json(filteredEvents);
   } catch (error) {
      console.error('Error fetching events by category:', error);
      res.status(500).json({ error: "Failed to fetch events by category" });
   }
});

// Get all unique categories
app.get("/categories", async (req, res) => {
   try {
      const categories = await Event.distinct("category");
      // Return only valid categories that match our configuration
      const validCategories = categories.filter(cat => 
        cat && CATEGORIES.includes(cat.trim())
      );
      res.status(200).json(validCategories);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
   }
});

// Get events with optional category filter - UPDATED
app.get("/events", async (req, res) => {
   try {
      const { category } = req.query;
      let query = {};
      
      if (category && category !== 'all') {
        const normalizedCategory = normalizeCategory(category);
        if (CATEGORIES.includes(normalizedCategory)) {
          query.category = normalizedCategory;
        }
      }
      
      const events = await Event.find(query).sort({ createdAt: -1 });
      res.status(200).json(events);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
   }
});

// Clean up existing events with invalid categories (one-time fix)
app.patch("/events/cleanup-categories", async (req, res) => {
  try {
    const events = await Event.find({});
    let updatedCount = 0;
    
    for (const event of events) {
      if (event.category) {
        const normalizedCategory = normalizeCategory(event.category);
        if (CATEGORIES.includes(normalizedCategory) && event.category !== normalizedCategory) {
          event.category = normalizedCategory;
          await event.save();
          updatedCount++;
          console.log(`Updated event ${event._id} category from "${event.category}" to "${normalizedCategory}"`);
        }
      }
    }
    
    res.json({ message: `Updated ${updatedCount} events with normalized categories` });
  } catch (error) {
    console.error('Error cleaning up categories:', error);
    res.status(500).json({ error: "Failed to clean up categories" });
  }
});

app.get("/event/:id", async (req, res) => {
   const { id } = req.params;
   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const event = await Event.findById(id);
      if (!event) {
         return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
   } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event from MongoDB" });
   }
});

app.post("/event/:eventId/like", async (req, res) => {
   try {
      const eventId = req.params.eventId;
      
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
         return res.status(400).json({ error: "Invalid event ID" });
      }

      const event = await Event.findById(eventId);
      if (!event) {
         return res.status(404).json({ message: "Event not found" });
      }

      event.likes += 1;
      const updatedEvent = await event.save();
      res.json(updatedEvent);
   } catch (error) {
      console.error("Error liking the event:", error);
      res.status(500).json({ message: "Server error" });
   }
});

app.get("/event/:id/ordersummary", async (req, res) => {
   const { id } = req.params;
   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const event = await Event.findById(id);
      if (!event) {
         return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch event from MongoDB" });
   }
});

app.get("/event/:id/ordersummary/paymentsummary", async (req, res) => {
   const { id } = req.params;
   try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
         return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const event = await Event.findById(id);
      if (!event) {
         return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
   } catch (error) {
      res.status(500).json({ error: "Failed to fetch event from MongoDB" });
   }
});

// Ticket routes
app.post("/tickets", async (req, res) => {
   try {
      const ticketDetails = req.body;
      const newTicket = new Ticket(ticketDetails);
      await newTicket.save();
      return res.status(201).json({ ticket: newTicket });
   } catch (error) {
      console.error("Error creating ticket:", error);
      return res.status(500).json({ error: "Failed to create ticket" });
   }
});

app.get("/tickets", async (req, res) => {
   try {
      const tickets = await Ticket.find();
      res.json(tickets);
   } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
   }
});

app.get("/tickets/user/:userId", async (req, res) => {
   try {
      const userId = req.params.userId;
      const tickets = await Ticket.find({ userid: userId });
      res.json(tickets);
   } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({ error: "Failed to fetch user tickets" });
   }
});

app.delete("/tickets/:id", async (req, res) => {
   try {
      const ticketId = req.params.id;
      const deletedTicket = await Ticket.findByIdAndDelete(ticketId);
      if (!deletedTicket) {
         return res.status(404).json({ error: "Ticket not found" });
      }
      res.status(200).json({ message: "Ticket deleted successfully" });
   } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ error: "Failed to delete ticket" });
   }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
   console.log('Available categories:', CATEGORIES);
});