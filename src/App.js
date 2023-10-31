import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import LoginPage from "./LoginPage";
import "./css/App.css";
import paperplanelogo from "./assets/paperplane-svgrepo-com.svg";
import greencirclelogo from "./assets/green-circle-svgrepo-com.svg";
import logoutsketch from "./assets/logout-sketch-svgrepo-com.svg";
import trashcan from "./assets/delete-svgrepo-com.svg";
import CustomModal from "./CustomModal";
import Notification from "./Notification";

const socket = io("http://localhost:3008");

function App() {
  const [notifications, setNotifications] = useState([]);

  const handleNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message,
    };
    setNotifications([...notifications, newNotification]);
  };

  socket.on("deleteResponse", (data) => {
    if (data.success === false) {
      handleNotification("There is nothing to delete.");
    }
  });

  const [message, setMessage] = useState("");

  const handleLogin = (success, senderId, sender) => {
    setIsLoggedIn(success);
    setsetUserSenderId(senderId);
    setUserSender(sender);
  };

  const [showModal, setShowModal] = useState(false);
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const handleSure = () => {
    setIsLoggedIn(false);
    setsetUserSenderId("");
    setUserSender("");
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const [showModalDelete, setShowModalDelete] = useState(false);
  const openModalDelete = () => {
    setShowModalDelete(true);
  };
  const closeModalDelete = () => {
    setShowModalDelete(false);
  };

  const handleSureDelete = (user_sender_id, reply_id) => {
    socket.emit("delete chat", {
      sender_id: user_sender_id,
      reply_id: reply_id,
    });
    setfinishConvConfirmed(true);
    closeModalDelete();
  };

  const handleCancelDelete = () => {
    closeModalDelete();
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user_sender, setUserSender] = useState("");
  const [user_sender_id, setsetUserSenderId] = useState("");
  const [isSearchBarFocused, setIsSearchBarFocused] = useState(null);

  const [messages, setMessages] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [reply_id, setSelectedUserId] = useState(null);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [finishConvConfirmed, setfinishConvConfirmed] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:3008/api/unreadMessages").then((response) => {
      const unreadMessagesMap = {};
      response.data.forEach((agent) => {
        const { username, agentname, unreadMessages } = agent;
        const key = `${username}-${agentname}`;
        unreadMessagesMap[key] = {
          username,
          agentname,
          unreadMessages,
        };
      });
      setUnreadMessages(unreadMessagesMap);
    });

    axios.get("http://localhost:3008/api/chat").then((response) => {
      setMessages(response.data);
    });

    axios.get("http://localhost:3008/api/agents").then((response) => {
      setMenuItems(response.data);
    });

    socket.on("chat message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
      if (selectedUser === data.sender || user_sender === data.sender) {
        setFilteredMessages((prevFilteredMessages) => [
          ...prevFilteredMessages,
          data,
        ]);
      }
    });

    setFilteredMessages(
      messages.filter(
        (msg) =>
          (msg.reply_id === reply_id || msg.reply_id === user_sender_id) &&
          (msg.sender === selectedUser || msg.sender === user_sender) &&
          user_sender_id !== msg.delete_chat
      )
    );

    if (finishConvConfirmed) {
      setSelectedUser(null);
      setSelectedUserId(null);
      setfinishConvConfirmed(false);
    }

    return () => {
      socket.off("chat message");
    };
  }, [
    selectedUser,
    user_sender,
    reply_id,
    user_sender_id,
    messages,
    finishConvConfirmed,
  ]);

  const handleUserClick = (retrieve_username, senderId) => {
    setSelectedUser(retrieve_username);
    setSelectedUserId(senderId);
    setMessage("");
    axios.post("http://localhost:3008/api/resetUnreadMessages", {
      username: retrieve_username,
      agentname: user_sender,
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() !== "") {
      socket.emit("chat message", {
        sender: user_sender,
        sender_id: user_sender_id,
        reply_id: reply_id,
        selectedUser,
        message,
      });

      setMessage("");
    }
  };

  const filteredMenuItems = menuItems.filter(
    (menuItem) =>
      menuItem.username !== user_sender &&
      menuItem.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxLength = 2200;
  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  return (
    <div>
      {isLoggedIn ? (
        <div className="app-container">
          <div className="chat-container">
            <div className="sidebar_chat">
              <button onClick={openModal} className="sign_out">
                <img
                  src={logoutsketch}
                  alt="sign-out"
                  style={{ width: "24px", height: "24px" }}
                />
              </button>
              <CustomModal
                show={showModal}
                onClose={closeModal}
                title="Logout"
                content2="Are you sure?"
                onSure={handleSure}
                onCancel={handleCancel}
              />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`search-bar-user ${
                  isSearchBarFocused ? "focused" : ""
                }`}
                onFocus={() => setIsSearchBarFocused(true)}
                onBlur={() => setIsSearchBarFocused(false)}
              />

              {filteredMenuItems.map((menuItem) => (
                <button
                  key={menuItem._id}
                  onClick={() =>
                    handleUserClick(menuItem.username, menuItem._id)
                  }
                  className={`menu-item ${
                    selectedUser === menuItem.username ? "active" : ""
                  }`}
                >
                  <span className="menu-item-text">
                    {unreadMessages[`${menuItem.username}-${user_sender}`] &&
                    unreadMessages[`${menuItem.username}-${user_sender}`]
                      .unreadMessages > 0 ? (
                      <>
                        <img
                          src={greencirclelogo}
                          alt="Unread Message"
                          className="notification-icon"
                        />
                      </>
                    ) : (
                      <button
                        onClick={openModalDelete}
                        className="trash-button"
                      >
                        <img
                          src={trashcan}
                          alt="delete message"
                          className="trash-icon"
                        />
                      </button>
                    )}{" "}
                    {menuItem.username}{" "}
                    {unreadMessages[`${menuItem.username}-${user_sender}`] &&
                    unreadMessages[`${menuItem.username}-${user_sender}`]
                      .unreadMessages > 0 ? (
                      <>
                        (
                        {
                          unreadMessages[`${menuItem.username}-${user_sender}`]
                            .unreadMessages
                        }
                        )
                      </>
                    ) : (
                      ""
                    )}
                  </span>
                </button>
              ))}
            </div>
            <CustomModal
              show={showModalDelete}
              onClose={closeModalDelete}
              title="Delete this chat?"
              onSure={() => handleSureDelete(user_sender_id, reply_id)}
              onCancel={handleCancelDelete}
            />
            <div className="chat-room">
              <ul className="message-list">
                {selectedUser ? (
                  filteredMessages.map((msg, index) => (
                    <li className="message" key={index}>
                      {msg.sender === selectedUser ? (
                        <div className="left-message">
                          <div className="sender">{msg.sender}</div>
                          <div className="message-content">{msg.message}</div>
                        </div>
                      ) : (
                        <div className="right-message">
                          <div className="sender">{msg.sender}</div>
                          <div className="message-content">{msg.message}</div>
                        </div>
                      )}
                    </li>
                  ))
                ) : (
                  <div className="centered-container">
                    <h1>Live Chat</h1>
                  </div>
                )}
              </ul>
              {selectedUser && (
                <div>
                  <form onSubmit={sendMessage} className="message-input">
                    <textarea
                      value={message}
                      onChange={handleChange}
                      placeholder="Type your message......"
                      className="input-field"
                      style={{ height: "100px" }}
                    ></textarea>
                    <button type="submit" className="send-button">
                      <img
                        src={paperplanelogo}
                        alt="Paper Plane"
                        style={{ width: "24px", height: "24px" }}
                      />
                    </button>
                  </form>
                  <div className="char-count">
                    {message.length.toLocaleString()}/
                    {maxLength.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <LoginPage
          onLogin={handleLogin}
          userLoggedIn={{
            isLoggedIn: isLoggedIn,
            user_sender_id: user_sender_id,
            user_sender: user_sender,
          }}
        />
      )}

      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          onClose={() => {
            setNotifications(
              notifications.filter((n) => n.id !== notification.id)
            );
          }}
        />
      ))}
    </div>
  );
}

export default App;
