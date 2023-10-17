const express = require("express");
const app = express();
const http = require("http").createServer(app);

const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect("mongodb://localhost/live-chat", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const chatSchema = new mongoose.Schema(
  {
    sender: String,
    sender_id: String,
    reply_id: String,
    message: String,
    delete_chat: String,
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
const Chat = mongoose.model("Chat", chatSchema);

const agentSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
  },
  { collection: "agent", versionKey: false }
);
const Agent = mongoose.model("Agent", agentSchema);

const unreadmessagesSchema = new mongoose.Schema(
  {
    username: String,
    agentname: String,
    unreadMessages: { type: Number, default: 0 },
    selected_user: String,
  },
  { collection: "unread_message", versionKey: false }
);
const Unread = mongoose.model("Unread", unreadmessagesSchema);

app.use(cors());
app.use(bodyParser.json());

io.on("connection", (socket) => {
  socket.on("delete chat", async (data) => {
    const { reply_id, sender_id } = data;
    try {
      const delete_msg_sender = await Chat.find({
        sender_id: sender_id,
        reply_id: reply_id,
      });
      const delete_msg_reply = await Chat.find({
        sender_id: reply_id,
        reply_id: sender_id,
      });
      if (delete_msg_sender.length !== 0) {
        for (const message of delete_msg_sender) {
          if (!message.delete_chat) {
            await Chat.updateMany(
              { reply_id: reply_id, sender_id: sender_id },
              { delete_chat: sender_id }
            );
            if (delete_msg_reply.length !== 0) {
              await Chat.updateMany(
                { sender_id: reply_id, reply_id: sender_id },
                { delete_chat: sender_id }
              );
            } else {
              await Chat.deleteMany({
                reply_id: reply_id,
                sender_id: sender_id,
              });
            }
          } else if (message.delete_chat === sender_id) {
            socket.emit("deleteResponse", { success: false });
          } else {
            await Promise.all([
              Chat.deleteMany({ sender_id: reply_id, reply_id: sender_id }),
              Chat.deleteMany({ reply_id: reply_id, sender_id: sender_id }),
            ]);
          }
        }
      } else {
        socket.emit("deleteResponse", { success: false });
      }
    } catch (error) {
      console.error(error);
    }
  });

  socket.on("chat message", async (data) => {
    const { sender, sender_id, reply_id, message, selectedUser } = data;
    const chat = new Chat({ sender, sender_id, reply_id, message });

    try {
      await chat.save();
      http.emit("chat message", data);
      const existingAgent = await Unread.findOne({
        username: sender,
        agentname: selectedUser,
      });
      if (existingAgent) {
        if (existingAgent.selected_user !== "selected") {
          await Unread.updateOne(
            { username: sender, agentname: selectedUser },
            { $inc: { unreadMessages: 1 } }
          );
        }
      } else {
        const unread = new Unread({
          username: sender,
          agentname: selectedUser,
          unreadMessages: 1,
          selected_user: "not selected",
        });
        await unread.save();
      }
    } catch (error) {
      console.error(error);
    }
  });
});

app.get("/api/chat", (req, res) => {
  Chat.find({})
    .then((chats) => {
      res.json(chats);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.get("/api/agents", (req, res) => {
  Agent.find({})
    .then((agent) => {
      res.json(agent);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  Agent.findOne({ username })
    .then((agent) => {
      if (agent) {
        if (agent.password === password) {
          const { _id, username } = agent;
          agent.save();

          res.json({
            success: true,
            sender_id: _id.toString(),
            sender: username,
          });
        } else {
          res.json({ success: false, error: "Incorrect password" });
        }
      } else {
        res.json({ success: false, error: "Invalid username" });
      }
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await Agent.findOne({ username });
    if (existingUser) {
      return res.json({ success: false });
    }
    const newUser = new Agent({
      username,
      password,
    });
    await newUser.save();
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/unreadMessages", (req, res) => {
  Unread.find({}, "username agentname unreadMessages")
    .then((agents) => {
      res.json(agents);
    })
    .catch((error) => {
      console.error(error);
      res.sendStatus(500);
    });
});

app.post("/api/resetUnreadMessages", async (req, res) => {
  const { username, agentname } = req.body;
  try {
    const agent = await Unread.findOne({
      username,
      agentname,
    });
    if (agent) {
      await Promise.all([
        Unread.updateOne(
          { username, agentname },
          { selected_user: "selected", unreadMessages: 0 }
        ),
        Unread.updateMany(
          { agentname, _id: { $ne: agent._id } },
          { selected_user: "not selected" }
        ),
      ]);
    } else {
      await Unread.updateMany(
        { agentname, username: { $ne: username } },
        { selected_user: "not selected" }
      );
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.use(express.static("live-chat/build"));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/build/index.html"));
  res.write("Socket.io is running");
  res.end();
});

const PORT = process.env.PORT || 3008;
http.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
