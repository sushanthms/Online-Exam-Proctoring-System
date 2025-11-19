import React from "react";
import { useParams } from "react-router-dom";
import CodingTestPage from "./CodingTestPage";
import "./CodingExamPage.css";

export default function CodingExamPage() {
  const { examId, questionId } = useParams();

  return (
    <div className="coding-exam-container">
      <div className="exam-header">
        <div className="exam-info">
          <h2>Coding Exam</h2>
          <div className="question-counter">
            {questionId ? `Question ${questionId}` : "Question"}
          </div>
        </div>
      </div>

      <div className="exam-body" style={{ padding: 20, width: "100%" }}>
        <CodingTestPage examId={examId} questionId={questionId} />
      </div>
    </div>
  );
}