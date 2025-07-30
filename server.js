
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// Enable sessions
app.use(
    session({
        secret: "your_secret_key", // Replace with a strong secret key
        resave: false,
        saveUninitialized: true,
    })
);

// Ensure `data.json` exists
const DATA_FILE = "data.json";
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2));
}

// Serve the home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});

// **User Registration**
app.post("/register", (req, res) => {
    const { username, mobile, email, password } = req.body;

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading user data");

        let users = JSON.parse(data).users || [];
        if (users.some((u) => u.email === email)) { // Email validation
            return res.status(400).send("Email already exists");
        }

        const newUser = {
            id: users.length + 1,
            username,
            mobile,
            email,
            password,
            data: [],
        };
        users.push(newUser);

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error saving user data");
            res.status(201).send("Registration successful");
        });
    });
});

// **User Login**
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading user data");

        let users = JSON.parse(data).users || [];
        const user = users.find(
            (u) => u.username === username && u.password === password
        );

        if (!user) return res.status(401).send("Invalid credentials");

        req.session.username = username; // Store user session
        res.status(200).send("Login successful");
    });
});

// **Forget Password**
app.post("/forgot-password", (req, res) => {
    const { email, newPassword } = req.body;

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading user data");

        let users = JSON.parse(data).users || [];
        const userIndex = users.findIndex((u) => u.email === email);

        if (userIndex === -1) return res.status(404).send("Email not found");

        users[userIndex].password = newPassword;

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error updating password");
            res.status(200).send("Password reset successfully");
        });
    });
});

// **Admin Login**
app.post("/admin-login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "admin") {
        req.session.isAdmin = true; // Set session as admin
        res.status(200).send("Admin login successful");
    } else {
        res.status(401).send("Invalid admin credentials");
    }
});

// **Check Login Status**
app.get("/status", (req, res) => {
    if (req.session && req.session.username) {
        res.json({ loggedIn: true, username: req.session.username });
    } else if (req.session && req.session.isAdmin) {
        res.json({ loggedIn: true, isAdmin: true });
    } else {
        res.json({ loggedIn: false });
    }
});

// **Fetch Contacts for User**
app.get("/contacts", (req, res) => {
    if (!req.session.username) return res.status(401).send("Unauthorized");

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading contacts");

        let users = JSON.parse(data).users || [];
        const user = users.find((u) => u.username === req.session.username);

        if (!user) return res.status(404).send("User not found");

        res.json(user.data); // Return only user's contacts
    });
});

// **Fetch Contact by ID**
app.get("/contacts/:id", (req, res) => {
    const contactId = parseInt(req.params.id);

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading contacts");

        const users = JSON.parse(data).users || [];
        const user = users.find((u) => u.username === req.session.username);

        if (!user) return res.status(404).send("User not found");

        const contact = user.data.find((c) => c.id === contactId);
        if (!contact) return res.status(404).send("Contact not found");

        res.json(contact);
    });
});

// **Admin-Specific Features**
// Fetch all data for admin
app.get("/admin/data", (req, res) => {
    if (!req.session.isAdmin) return res.status(401).send("Unauthorized");

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading data");

        const allData = JSON.parse(data).users || [];
        res.json(allData); // Return all user data
    });
});

// Add user (Admin only)
app.post("/admin/add-user", (req, res) => {
    if (!req.session.isAdmin) return res.status(401).send("Unauthorized");

    const { username, mobile, email, password } = req.body;

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading user data");

        let users = JSON.parse(data).users || [];
        if (users.some((u) => u.username === username)) {
            return res.status(400).send("Username already exists");
        }

        const newUser = {
            id: users.length + 1,
            username,
            mobile,
            email,
            password,
            data: [],
        };
        users.push(newUser);

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error saving user data");
            res.status(201).send("User added successfully");
        });
    });
});

// Update user (Admin only)
app.put("/admin/update-user", (req, res) => {
    if (!req.session.isAdmin) return res.status(401).send("Unauthorized");

    const updatedUser = req.body;

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading data");

        let users = JSON.parse(data).users || [];
        const userIndex = users.findIndex((u) => u.id === parseInt(updatedUser.id));

        if (userIndex === -1) return res.status(404).send("User not found");

        users[userIndex] = {
            ...users[userIndex],
            ...updatedUser,
        };

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error updating user");
            res.status(200).send("User updated successfully");
        });
    });
});

// Delete user (Admin only)
app.delete("/admin/delete-user/:id", (req, res) => {
    if (!req.session.isAdmin) return res.status(401).send("Unauthorized");

    const userId = parseInt(req.params.id);

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading data");

        let users = JSON.parse(data).users || [];
        const updatedUsers = users.filter((u) => u.id !== userId);

        if (users.length === updatedUsers.length) return res.status(404).send("User not found");

        fs.writeFile(DATA_FILE, JSON.stringify({ users: updatedUsers }, null, 2), (err) => {
            if (err) return res.status(500).send("Error deleting user");
            res.status(200).send("User deleted successfully");
        });
    });
});

// **Add Contact**
app.post("/add-contact", (req, res) => {
    if (!req.session.username) return res.status(401).send("Unauthorized");

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading data");

        let users = JSON.parse(data).users || [];
        const userIndex = users.findIndex((u) => u.username === req.session.username);

        if (userIndex === -1) return res.status(404).send("User not found");

        const newContact = { ...req.body, id: users[userIndex].data.length + 1 };
        users[userIndex].data.push(newContact);

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error saving contact");
            res.status(201).send("Contact added successfully");
        });
    });
});

// **Update Contact**
app.put("/update-contact", (req, res) => {
    if (!req.session.username) return res.status(401).send("Unauthorized");

    const updatedContact = req.body;

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading contacts");

        let users = JSON.parse(data).users || [];
        const user = users.find((u) => u.username === req.session.username);

        if (!user) return res.status(404).send("User not found");

        const index = user.data.findIndex((c) => c.id === parseInt(updatedContact.id));
        if (index === -1) return res.status(404).send("Contact not found");

        user.data[index] = { ...user.data[index], ...updatedContact, id: user.data[index].id };

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error updating contact");
            res.status(200).send("Contact updated successfully");
        });
    });
});

// **Delete Contact**
app.delete("/delete/:id", (req, res) => {
    if (!req.session.username) return res.status(401).send("Unauthorized");

    const contactId = parseInt(req.params.id);

    fs.readFile(DATA_FILE, (err, data) => {
        if (err) return res.status(500).send("Error reading contacts");

        let users = JSON.parse(data).users || [];
        const userIndex = users.findIndex((u) => u.username === req.session.username);

        if (userIndex === -1) return res.status(404).send("User not found");

        const updatedContacts = users[userIndex].data.filter((c) => c.id !== contactId);
        if (users[userIndex].data.length === updatedContacts.length) {
            return res.status(404).send("Contact not found");
        }

        users[userIndex].data = updatedContacts;

        fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), (err) => {
            if (err) return res.status(500).send("Error deleting contact");
            res.status(200).send("Contact deleted successfully");
        });
    });
});

// **Logout**
app.post("/logout", (req, res) => {
    req.session.destroy();
    res.status(200).send("Logged out successfully");
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});