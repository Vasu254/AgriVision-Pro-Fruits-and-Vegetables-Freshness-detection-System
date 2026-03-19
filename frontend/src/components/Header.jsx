import React from "react";
import { FaAppleAlt, FaCarrot } from "react-icons/fa";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <FaAppleAlt className="icon" />
          <FaCarrot className="icon" />
        </div>
        <h1 className="title">Fruits & Vegetables Freshness Detector</h1>
        <p className="subtitle">
          Upload an image of a fruit or vegetable to check its freshness using
          AI
        </p>
      </div>
    </header>
  );
};

export default Header;
