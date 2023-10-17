import React, { useState, useEffect } from "react";
import "./css/Notification.css";
import close_option from "./assets/close-circle-1-svgrepo-com.svg";

const Notification = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 600);

    return () => clearTimeout(timer);
  }, [onClose]);

  return isVisible ? (
    <div className={"notification"}>
      {message}
      <span className="close-button" onClick={() => setIsVisible(false)}>
        <img
          src={close_option}
          alt="Close"
          style={{ width: "24px", height: "24px" }}
        />
      </span>
    </div>
  ) : null;
};

export default Notification;
