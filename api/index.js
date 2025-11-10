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
const fs = require("fs"); 

// Assuming you have an Event Model file. 
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
// 🟢 ADMIN SEEDING AND DATABASE CONNECTION
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

// 🟢 MULTER STORAGE CONFIGURATION
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "uploads"));
    },
    filename: (req, file, cb) => {
        // Generate unique filename to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({ 
    storage,
    // Add file filter and limits
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

// 🟢 Unified Helper to Extract Token Data and Full User Info
const getUserDataFromReq = (req) => {
    return new Promise((resolve, reject) => {
        const { token } = req.cookies;
        if (!token) {
            // Reject the promise if no token is present
            return reject(new Error("No authentication token provided"));
        }

        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) {
                // Reject the promise if JWT is invalid
                return reject(new Error("Invalid token"));
            }
            
            // Use existing function to fetch the full document and role
            const userInfo = await getUserRoleAndData(userData.id);

            if (!userInfo) {
                return reject(new Error("User data not found for token ID"));
            }

            // Resolve with unified user object
            resolve({
                id: userInfo.userData._id,
                email: userInfo.userData.email,
                name: userInfo.userData.name,
                role: userInfo.role, // 'admin', 'contributor', or 'user'
            });
        });
    });
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
            role: 'user'
        },
        jwtSecret,
        {},
        (err, token) => {
            if (err) {
                return res.status(500).json({ error: "Failed to generate token" });
            }
            res.cookie("token", token).json({
                _id: userDoc._id,
                name: userDoc.name,
                email: userDoc.email,
                role: 'user'
            });
        }
    );
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

app.post("/contributor/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const contributorDoc = await ContributorModel.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
            // status will default to 'on_progress' from the schema
        });
        res.json(contributorDoc);
    } catch (e) {
        // Handle duplicate email or other validation errors
        res.status(422).json({ error: "Contributor registration failed" });
    }
});

// Contributor Login (UPDATED with status check)
app.post("/contributor/login", async (req, res) => {
    const { email, password } = req.body;
    const contributorDoc = await ContributorModel.findOne({ email });

    if (!contributorDoc) return res.status(404).json({ error: "Contributor not found" });
    
    // 🛑 NEW: Check if the contributor is accepted
    if (contributorDoc.status !== 'accepted') {
        // Prevent login and inform the user they are pending approval
        return res.status(403).json({ error: "Account pending approval by Admin" });
    }

    const passOk = bcrypt.compareSync(password, contributorDoc.password);
    if (!passOk) return res.status(401).json({ error: "Invalid password" });

    jwt.sign(
        { email: contributorDoc.email, id: contributorDoc._id, role: 'contributor' },
        jwtSecret,
        {},
        (err, token) => {
            if (err) return res.status(500).json({ error: "Failed to generate token" });
            res.cookie("token", token).json({
                _id: contributorDoc._id,
                name: contributorDoc.name,
                email: contributorDoc.email,
                role: 'contributor'
            });
        }
    );
});
// GET /pendingContributors
// Fetches all contributors awaiting approval for the Admin UI.
app.get("/pendingContributors", async (req, res) => {
    try {
        // 🚨 IMPORTANT: Add Admin Auth Middleware here.
        const pendingContributors = await ContributorModel.find({ status: 'on_progress' }).select('-password');
        res.json(pendingContributors);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch pending contributors" });
    }
});
// PUT /contributors/:id/status
// Updates a contributor's status to 'accepted'
app.put("/contributors/:id/status", async (req, res) => {
    // 🚨 IMPORTANT: Add Admin Auth Middleware here.
    const { id } = req.params;
    const { status } = req.body; // Expects 'accepted' or 'declined'

    // Simple validation
    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: "Invalid status update value." });
    }

    try {
        const contributorDoc = await ContributorModel.findByIdAndUpdate(
            id, 
            { status: status }, 
            { new: true } // Return the updated document
        ).select('-password');

        if (!contributorDoc) return res.status(404).json({ error: "Contributor not found" });
        
        // If status is 'declined', you might want to send a different response 
        // or optionally use the DELETE route below, which is simpler for the frontend.
        res.json(contributorDoc);
    } catch (e) {
        res.status(500).json({ error: "Failed to update contributor status" });
    }
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
// 🟢 COMMON LOGOUT ROUTES
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
// 🟢 EVENT SCHEMA AND HELPERS
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

// Event Schema
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
    status: { 
        type: String, 
        enum: ['pending', 'published'], 
        default: 'pending' // 👈 This ensures all new events start as PENDING
    },
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

// =================================================================
// 🟢 EVENT CRUD AND LISTING ROUTES
// =================================================================

// 1. Create Event (Status defaults to 'pending')
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
        
        // Store image path without leading slash
        if (req.file) {
            eventData.image = `uploads/${req.file.filename}`;
            console.log('Image saved with path:', eventData.image);
        } else {
            eventData.image = "";
        }
        
        // Status defaults to 'pending' from the schema
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

// 2. Get ONLY Published Events (For Public Index Page)
app.get('/publishedEvents', async (req, res) => {
    try {
        // Find events where status is explicitly 'published'
        const publishedEvents = await Event.find({ status: 'published' }).sort({ eventDate: 1 });
        console.log(`Fetched ${publishedEvents.length} published events.`);
        res.json(publishedEvents);
    } catch (error) {
        console.error("Error fetching published events:", error);
        res.status(500).json({ error: 'Failed to fetch published events' });
    }
});

// 3. Admin Route: Get ONLY Pending Events (FIXED Admin Check & Error Handling)
app.get('/pendingEvents', async (req, res) => {
    try {
        // 1. Get user data and role. This line is prone to throwing if no token is present.
        const userData = await getUserDataFromReq(req);
        
        // 2. Check if the user is an admin
        if (userData.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Only admins can view pending events.' });
        }

        // 3. Fetch pending events
        const pendingEvents = await Event.find({ status: 'pending' }).sort({ eventDate: 1 });
        console.log(`Admin fetched ${pendingEvents.length} pending events.`);
        res.json(pendingEvents);
    } catch (error) {
        console.error("Error fetching pending events:", error.message);
        // 🟢 FIX: Return 401 for token/auth issues, 500 otherwise
        if (error.message.includes('token') || error.message.includes('not found')) {
            return res.status(401).json({ error: 'Authentication failed: Please log in as Admin.' });
        }
        res.status(500).json({ error: 'Failed to fetch pending events or unauthorized access.' });
    }
});

// 4. Admin Route: Update status to 'published' (FIXED Admin Check)
app.put('/events/:id/status', async (req, res) => {
    try {
        // 1. Admin Authentication check
        const userData = await getUserDataFromReq(req);
        
        // 2. Check if the user is an admin
        if (userData.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Only admins can approve events.' });
        }
        
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }

        if (status !== 'published') {
            return res.status(400).json({ error: 'Invalid status update. Can only publish events through this endpoint.' });
        }

        const eventDoc = await Event.findByIdAndUpdate(
            id,
            { status: 'published' },
            { new: true } // Return the updated document
        );

        if (!eventDoc) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log(`Event ID ${id} approved and published by Admin: ${userData.name}`);
        res.json(eventDoc);

    } catch (error) {
        console.error("Error updating event status:", error.message);
        // Return 401 for token/auth issues, 500 otherwise
        if (error.message.includes('token') || error.message.includes('not found')) {
            return res.status(401).json({ error: 'Authentication failed: Invalid or missing token/user.' });
        }
        res.status(500).json({ error: 'Failed to update event status.' });
    }
});


// Get all events (mostly for debugging/internal use)
app.get("/createEvent", async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events from MongoDB" });
    }
});

// Get events by category
app.get("/events/category/:category", async (req, res) => {
    try {
        let { category } = req.params;
        
        if (!category) {
            return res.status(400).json({ error: "Category parameter is required" });
        }
        
        const normalizedCategory = normalizeCategory(category);
        
        if (!CATEGORIES.includes(normalizedCategory)) {
            return res.status(400).json({ error: "Invalid category" });
        }
        
        // Only fetch published events for public routes
        const events = await Event.find({ category: normalizedCategory, status: 'published' }).sort({ eventDate: 1 });
        
        res.status(200).json(events);
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
        let query = { status: 'published' }; // Default to published for public view
        
        if (category && category !== 'all') {
            const normalizedCategory = normalizeCategory(category);
            if (CATEGORIES.includes(normalizedCategory)) {
                query.category = normalizedCategory;
            }
        }
        
        const events = await Event.find(query).sort({ eventDate: 1 });
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

// Get single event
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

// Like Event
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

// Order Summary Routes (Placeholder implementations)
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
// --- Example: API to send a mass notification to event attendees ---
app.post("/event/:eventId/notify", async (req, res) => {
    const { eventId } = req.params;
    const { message, subject } = req.body; // Data from the contributor's form

    try {
        // 1. Fetch the event and its attendees (tickets/orders)
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ error: "Event not found." });

        // 2. Logic to fetch all user emails who bought tickets for this event
        // const attendees = await Ticket.find({ eventId: eventId }).populate('userId', 'email');
        // const emailList = [...new Set(attendees.map(t => t.userId.email))];

        // 3. Logic to send the email/notification (using a mail service like nodemailer)
        // await sendMassEmail(emailList, subject, message);

        res.status(200).json({ message: `Notification successfully queued for ${event.title}.` });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ error: "Failed to send event notification." });
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

// =================================================================
// 🟢 ADMIN MANAGEMENT ROUTES
// =================================================================

// GET All Users (for Admin Dashboard)
app.get("/users",  async (req, res) => {
    try {
        // Exclude the password field for security
        const users = await UserModel.find().select('-password');
        res.json(users);
    } catch (e) {
        console.error("Error fetching users:", e);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET All Contributors (for Admin Dashboard)
app.get("/contributors",  async (req, res) => {
    try {
        // Exclude the password field for security
        const contributors = await ContributorModel.find().select('-password');
        res.json(contributors);
    } catch (e) {
        console.error("Error fetching contributors:", e);
        res.status(500).json({ error: "Failed to fetch contributors" });
    }
});

// DELETE Event by ID
app.delete("/events/:id",  async (req, res) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid event ID" });
        }
        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        // Delete associated image file
        if (deletedEvent.image) {
            // Note: deletedEvent.image is stored as 'uploads/filename.ext'
            const imagePath = path.join(__dirname, deletedEvent.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted file: ${imagePath}`);
            } else {
                console.log(`File not found: ${imagePath}`);
            }
        }

        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

// DELETE User by ID
app.delete("/users/:id",  async (req, res) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        const deletedUser = await UserModel.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// DELETE Contributor by ID
app.delete("/contributors/:id",  async (req, res) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid contributor ID" });
        }
        const deletedContributor = await ContributorModel.findByIdAndDelete(id);
        if (!deletedContributor) {
            return res.status(404).json({ error: "Contributor not found" });
        }
        res.status(200).json({ message: "Contributor deleted successfully" });
    } catch (error) {
        console.error("Error deleting contributor:", error);
        res.status(500).json({ error: "Failed to delete contributor" });
    }
});


// =================================================================
// 🟢 UTILITY ROUTES (FOR ONE-TIME FIXES)
// =================================================================

// NEW: Fix existing image paths (run this once to fix old events)
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
app.get('/events/count',  async (req, res) => {
    try {
        // Count all events with status 'published'
        const count = await Event.countDocuments({ status: 'published' });
        res.json({ count });
    } catch (error) {
        console.error("Error fetching published event count:", error);
        res.status(500).json({ message: 'Server error fetching event count' });
    }
});

app.get('/users/count',  async (req, res) => {
    try {
        // Count all documents in the standard UserModel
        const userCount = await UserModel.countDocuments();
        
        // Optionally add Contributor count, depending on how you define "Total Users"
        // const contributorCount = await ContributorModel.countDocuments();
        // const totalUsers = userCount + contributorCount;

        res.json({ count: userCount });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ message: 'Server error fetching user count' });
    }
});


app.get('/pendingEvents/count', async (req, res) => {
    try {
        // Count all events with status 'pending'
        const count = await Event.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (error) {
        console.error("Error fetching pending event count:", error);
        res.status(500).json({ message: 'Server error fetching pending event count' });
    }
});

// =================================================================
// 🟢 UNIFIED PROFILE MANAGEMENT ROUTES (NEW)
// =================================================================

// 1. GET FULL Profile Data (including new fields)
app.get("/profile", async (req, res) => {
    try {
        const userInfo = await getUserDataFromReq(req);
        
        // Fetch the full user document based on the role and ID
        let Model;
        switch (userInfo.role) {
            case 'admin': Model = AdminModel; break;
            case 'contributor': Model = ContributorModel; break;
            case 'user': Model = UserModel; break;
            default: return res.status(400).json({ error: "Invalid user role" });
        }

        // Fetch the entire document, excluding the password
        const fullProfile = await Model.findById(userInfo.id).select('-password');
        
        if (!fullProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        // Return the full document + role
        res.json({ ...fullProfile.toObject(), role: userInfo.role });

    } catch (error) {
        // Includes errors from getUserDataFromReq (No token, Invalid token)
        console.error("Error fetching full profile:", error);
        res.status(401).json({ error: "Unauthorized or Invalid token" });
    }
});


// 2. PUT Profile Update (Handles text fields and image upload)
app.put("/profile", upload.single("photo"), async (req, res) => {
    try {
        // 1. Authenticate user
        const userInfo = await getUserDataFromReq(req);
        const { id, role } = userInfo;

        // 2. Determine the correct Mongoose model
        let Model;
        switch (role) {
            case 'admin': Model = AdminModel; break;
            case 'contributor': Model = ContributorModel; break;
            case 'user': Model = UserModel; break;
            default: return res.status(400).json({ error: "Invalid user role" });
        }

        // 3. Prepare update data
        const { name, email, bio, skills, preferences } = req.body;
        
        // Find the current document to check for existing photo
        const currentDoc = await Model.findById(id);
        if (!currentDoc) {
            return res.status(404).json({ error: "User profile not found" });
        }

        let updateData = { name, email, bio };

        // Handle skills and preferences (assuming they are sent as JSON strings from frontend)
        try {
            updateData.skills = skills ? JSON.parse(skills) : currentDoc.skills;
            updateData.preferences = preferences ? JSON.parse(preferences) : currentDoc.preferences;
        } catch (e) {
            console.error("Error parsing JSON data for skills/preferences:", e);
            return res.status(400).json({ error: "Skills or preferences data is invalid JSON format." });
        }


        // 4. Handle Photo Update
        if (req.file) {
            // New photo uploaded: set the new path
            updateData.photo = `uploads/${req.file.filename}`;
            
            // Delete the old photo file if it exists and is not empty
            if (currentDoc.photo) {
                const oldPath = path.join(__dirname, currentDoc.photo);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log(`Deleted old photo: ${oldPath}`);
                }
            }
        }
        // NOTE: If no new file is uploaded, updateData.photo is NOT set, 
        // preserving the currentDoc.photo in the database during update.


        // 5. Execute the update
        const updatedProfile = await Model.findByIdAndUpdate(
            id,
            { $set: updateData }, // Use $set to only update the provided fields
            { new: true, runValidators: true }
        ).select('-password'); // Exclude password from response

        // 6. Respond
        res.json({ ...updatedProfile.toObject(), role: role });

    } catch (error) {
        console.error("Error updating profile:", error.message);
        if (error.message.includes('token') || error.message.includes('not found')) {
            return res.status(401).json({ error: 'Authentication failed: Invalid or missing token.' });
        }
        res.status(500).json({ error: "Failed to update profile: " + error.message });
    }
});

// =================================================================

app.listen(4000, () => {
    console.log("Server running on port 4000");
});