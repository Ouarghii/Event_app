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

// 🟢 FIXED MULTER STORAGE CONFIGURATION
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "uploads"));
   },
   filename: (req, file, cb) => {
      // 🟢 FIX: Generate unique filename to prevent overwriting
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
   },
});

const upload = multer({ 
   storage,
   // 🟢 FIX: Add file filter and limits
   fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
         cb(null, true);
      } else {
         cb(new Error('Only image files are allowed!'), false);
      }
   },
   limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
   }
});

// =================================================================
// 🟢 HELPER FUNCTIONS FOR ROLE HANDLING
// =================================================================

// Helper function to get user role and data from any model
const getUserRoleAndData = async (userId) => {
    try {
        // Check Admin model
        const admin = await AdminModel.findById(userId);
        if (admin) {
            return { role: 'admin', userData: admin };
        }

        // Check Contributor model
        const contributor = await ContributorModel.findById(userId);
        if (contributor) {
            return { role: 'contributor', userData: contributor };
        }

        // Check User model
        const user = await UserModel.findById(userId);
        if (user) {
            return { role: 'user', userData: user };
        }

        return null;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
};

// Middleware to check if user has permission to create events
const canCreateEvents = (req, res, next) => {
    const { token } = req.cookies;
    
    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userInfo = await getUserRoleAndData(userData.id);
        
        if (!userInfo) {
            return res.status(401).json({ error: "User not found" });
        }

        // Check if user has permission to create events
        if (!['admin', 'contributor'].includes(userInfo.role)) {
            return res.status(403).json({ 
                error: "Insufficient permissions. Only admins and contributors can create events." 
            });
        }

        // Attach user info to request for use in the route handler
        req.user = {
            id: userInfo.userData._id,
            role: userInfo.role,
            name: userInfo.userData.name
        };
        
        next();
    });
};

// =================================================================
// 🟢 BASIC ROUTES
// =================================================================

app.get("/test", (req, res) => {
   res.json("test ok");
});

// =================================================================
// 🟢 USER ROUTES
// =================================================================

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
         role: 'user' // 🟢 ADD ROLE TO TOKEN
      },
      jwtSecret,
      {},
      (err, token) => {
         if (err) {
            return res.status(500).json({ error: "Failed to generate token" });
         }
         // 🟢 RETURN ROLE IN RESPONSE
         res.cookie("token", token).json({
            _id: userDoc._id,
            name: userDoc.name,
            email: userDoc.email,
            role: 'user'
         });
      }
   );
});

app.get("/profile", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) return res.json(null);
            
            const userDoc = await UserModel.findById(userData.id);
            if (userDoc) {
                res.json({ 
                    name: userDoc.name, 
                    email: userDoc.email, 
                    _id: userDoc._id,
                    role: 'user' // 🟢 ADD ROLE
                });
            } else {
                res.json(null); 
            }
        });
    } else {
        res.json(null);
    }
});

// =================================================================
// 🟢 ADMIN ROUTES
// =================================================================

// Admin Login
app.post("/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const adminDoc = await AdminModel.findOne({ email });

    if (!adminDoc) return res.status(404).json({ error: "Admin not found" });

    const passOk = bcrypt.compareSync(password, adminDoc.password);
    if (!passOk) return res.status(401).json({ error: "Invalid password" });

    jwt.sign(
        { email: adminDoc.email, id: adminDoc._id, role: 'admin' },
        jwtSecret,
        {},
        (err, token) => {
            if (err) return res.status(500).json({ error: "Failed to generate token" });
            // 🟢 RETURN ROLE IN RESPONSE
            res.cookie("token", token).json({
                _id: adminDoc._id,
                name: adminDoc.name,
                email: adminDoc.email,
                role: 'admin'
            });
        }
    );
});

// Admin Profile
app.get("/admin/profile", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) return res.json(null);
            const adminDoc = await AdminModel.findById(userData.id);
            if (adminDoc) {
                res.json({ 
                    name: adminDoc.name, 
                    email: adminDoc.email, 
                    _id: adminDoc._id, 
                    role: 'admin' 
                });
            } else {
                res.json(null);
            }
        });
    } else {
        res.json(null);
    }
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
        { email: contributorDoc.email, id: contributorDoc._id, role: 'contributor' },
        jwtSecret,
        {},
        (err, token) => {
            if (err) return res.status(500).json({ error: "Failed to generate token" });
            // 🟢 RETURN ROLE IN RESPONSE
            res.cookie("token", token).json({
                _id: contributorDoc._id,
                name: contributorDoc.name,
                email: contributorDoc.email,
                role: 'contributor'
            });
        }
    );
});

// Contributor Profile
app.get("/contributor/profile", (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) return res.json(null);
            const contributorDoc = await ContributorModel.findById(userData.id);
            if (contributorDoc) {
                res.json({ 
                    name: contributorDoc.name, 
                    email: contributorDoc.email, 
                    _id: contributorDoc._id, 
                    role: 'contributor' 
                });
            } else {
                res.json(null);
            }
        });
    } else {
        res.json(null);
    }
});

// =================================================================
// 🟢 UNIFIED PROFILE ENDPOINT (WORKS FOR ALL ROLES)
// =================================================================

app.get("/user/profile", (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.json(null);
    }

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) return res.json(null);
        
        const userInfo = await getUserRoleAndData(userData.id);
        
        if (userInfo) {
            res.json({
                _id: userInfo.userData._id,
                name: userInfo.userData.name,
                email: userInfo.userData.email,
                role: userInfo.role
            });
        } else {
            res.json(null);
        }
    });
});

// =================================================================
// 🟢 COMMON ROUTES (FOR ALL ROLES)
// =================================================================

app.post("/logout", (req, res) => {
   res.cookie("token", "").json(true);
});

app.post("/admin/logout", (req, res) => {
   res.cookie("token", "").json(true);
});

app.post("/contributor/logout", (req, res) => {
   res.cookie("token", "").json(true);
});

// =================================================================
// 🟢 EVENT ROUTES WITH ROLE PROTECTION
// =================================================================

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

// Updated Event Schema with Category Field and Owner Role
const eventSchema = new mongoose.Schema({
   owner: String,
   ownerRole: {
     type: String,
     enum: ['user', 'admin', 'contributor'],
     default: 'user'
   },
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
      trim: true
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

// 🟢 FIXED EVENT CREATION - CORRECT IMAGE PATH HANDLING
app.post("/createEvent", canCreateEvents, upload.single("image"), async (req, res) => {
   try {
      const eventData = req.body;
      
      // Add the user info from middleware
      eventData.owner = req.user.id;
      eventData.ownerRole = req.user.role;
      eventData.organizedBy = req.user.name; // Use the creator's name as organizer
      
      // Normalize and validate category
      if (!eventData.category) {
        return res.status(400).json({ error: "Category is required" });
      }
      
      const normalizedCategory = normalizeCategory(eventData.category);
      if (!CATEGORIES.includes(normalizedCategory)) {
        return res.status(400).json({ error: "Invalid category" });
      }
      
      eventData.category = normalizedCategory;
      
      // 🟢 FIX: Store image path without leading slash to avoid double slashes
      if (req.file) {
        eventData.image = `uploads/${req.file.filename}`;
        console.log('Image saved with path:', eventData.image);
      } else {
        eventData.image = "";
      }
      
      const newEvent = new Event(eventData);
      await newEvent.save();
      
      console.log(`Event created by ${req.user.role} (${req.user.name}) with category: "${eventData.category}"`);
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

// 🟢 NEW: Fix existing image paths (run this once to fix old events)
app.patch("/events/fix-image-paths", async (req, res) => {
  try {
    const events = await Event.find({});
    let updatedCount = 0;
    
    for (const event of events) {
      if (event.image && event.image.startsWith('/uploads/')) {
        // Remove the leading slash to fix the path
        event.image = event.image.substring(1);
        await event.save();
        updatedCount++;
        console.log(`Fixed image path for event ${event._id}: ${event.image}`);
      }
    }
    
    res.json({ message: `Updated ${updatedCount} events with fixed image paths` });
  } catch (error) {
    console.error('Error fixing image paths:', error);
    res.status(500).json({ error: "Failed to fix image paths" });
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

// =================================================================
// 🟢 TICKET ROUTES
// =================================================================

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
   console.log('🟢 Image serving available at: http://localhost:4000/uploads/');
});