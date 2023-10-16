import React, { useState, useEffect } from "react";
import axios from "axios";
import { MD5 } from "crypto-js";
import "./css/LoginPage.css";
import Notification from "./Notification";
import CustomModal from "./CustomModal";

const LoginPage = ({ onLogin, userLoggedIn }) => {
  useEffect(() => {
    if (userLoggedIn.isLoggedIn) {
      const { isLoggedIn, user_sender_id, user_sender } = userLoggedIn;
      onLogin({
        success: isLoggedIn,
        senderId: user_sender_id,
        sender: user_sender,
      });
    }
  }, [userLoggedIn]);

  const [showModal, setShowModal] = useState(false);
  const openModal = () => {
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
  };

  const [create_username, setCreateUsername] = useState("");
  const [create_password, setCreatePassword] = useState("");

  const handleSure = async (e) => {
    e.preventDefault();
    if (!create_username || !create_password) {
      handleNotification("Username and password are required.");
      return;
    }

    if (create_username.length < 6 || create_password.length < 6) {
      handleNotification(
        "Username and password must be at least 6 characters."
      );
      return;
    }

    if (/\s/.test(create_username)) {
      handleNotification("Username can't contain spaces.");
      return;
    }

    const sensitiveCharacters = /[!@#$%^&*()+{}\[\]:;<>,.?~\\]/;
    if (sensitiveCharacters.test(create_username)) {
      handleNotification("Username can't contain sensitive characters.");
      return;
    }

    try {
      const hashedPassword = MD5(create_password).toString();
      const response = await axios.post("http://localhost:3008/api/signup", {
        username: create_username,
        password: hashedPassword,
      });

      if (response.data.success) {
        handleNotification("Sign-up successful. You can now log in.");
        closeModal();
      } else {
        handleNotification("Username already exists.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    closeModal();
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [notifications, setNotifications] = useState([]);

  const handleNotification = (message) => {
    const newNotification = {
      id: Date.now(),
      message,
    };
    setNotifications([...notifications, newNotification]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const hashedPassword = MD5(password).toString();
      const response = await axios.post("http://localhost:3008/api/login", {
        username,
        password: hashedPassword,
      });

      if (response.data.success) {
        const { success, sender_id, sender } = response.data;
        onLogin(success, sender_id, sender);
      } else {
        if (response.data.error === "Invalid username") {
          handleNotification("The provided username is invalid.");
        } else if (response.data.error === "Incorrect password") {
          handleNotification("The provided password is incorrect.");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="login-frame">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="input-label">
              Username:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field2"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="input-label">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field2"
            />
          </div>
          <div align="right">
            <button type="submit" className="login-button">
              Login
            </button>
          </div>
        </form>
        <button
          onClick={openModal}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Don't have an account?
        </button>
        <CustomModal
          show={showModal}
          onClose={closeModal}
          title="Create Account"
          content={
            <div>
              <div className="input-container">
                <label htmlFor="create_username">Username:</label>
                <input
                  type="text"
                  id="create_username"
                  value={create_username}
                  onChange={(e) => setCreateUsername(e.target.value)}
                />
              </div>
              <div className="input-container">
                <label htmlFor="create_password">Password:</label>
                <input
                  type="password"
                  id="create_password"
                  value={create_password}
                  onChange={(e) => setCreatePassword(e.target.value)}
                />
              </div>
            </div>
          }
          onSure={handleSure}
          onCancel={handleCancel}
        />
      </div>
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
};

export default LoginPage;
