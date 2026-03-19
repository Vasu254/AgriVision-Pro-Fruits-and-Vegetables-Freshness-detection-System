import React from "react";
import { FaCheckCircle, FaTimesCircle, FaPercentage } from "react-icons/fa";
import "./PredictionResult.css";

const PredictionResult = ({ prediction }) => {
  const isFresh = prediction.is_fresh;
  const confidence = (prediction.confidence * 100).toFixed(2);

  return (
    <div className={`prediction-result ${isFresh ? "fresh" : "rotten"}`}>
      <div className="result-header">
        <div
          className={`status-icon ${isFresh ? "fresh-icon" : "rotten-icon"}`}
        >
          {isFresh ? <FaCheckCircle /> : <FaTimesCircle />}
        </div>
        <h2 className="prediction-text">{isFresh ? "Fresh!" : "Not Fresh"}</h2>
      </div>

      <div className="confidence-section">
        <div className="confidence-header">
          <FaPercentage className="percent-icon" />
          <span>Confidence Score</span>
        </div>
        <div className="confidence-bar-container">
          <div
            className={`confidence-bar ${isFresh ? "fresh-bar" : "rotten-bar"}`}
            style={{ width: `${confidence}%` }}
          >
            <span className="confidence-value">{confidence}%</span>
          </div>
        </div>
      </div>

      <div className="recommendation">
        <h3>Recommendation</h3>
        <p>{prediction.recommendation}</p>
      </div>

      {prediction.all_predictions && (
        <div className="all-predictions">
          <h3>Detailed Analysis</h3>
          <div className="predictions-grid">
            {Object.entries(prediction.all_predictions).map(([key, value]) => (
              <div key={key} className="prediction-item">
                <span className="prediction-label">{key}</span>
                <span className="prediction-value">
                  {(value * 100).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionResult;
