import React from "react";
import "./css/CustomModal.css";

const CustomModal = ({
  show,
  onClose,
  title,
  content,
  content2,
  onSure,
  onCancel,
}) => {
  const modalStyle = {
    display: show ? "block" : "none",
  };

  return (
    <div className="custom-modal" style={modalStyle}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <h2 style={{ textAlign: "center" }}>{title}</h2>
        {content}
        <p style={{ textAlign: "center" }}>{content2}</p>
        <div className="button-container" style={{ textAlign: "right" }}>
          <button className="modal-button" onClick={onSure}>
            Proceed
          </button>
          <button className="modal-button cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
