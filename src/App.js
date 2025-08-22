import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Helper to decode HTML entities returned by API or JSON
function decodeHtml(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const firstOptionRef = useRef(null);

  useEffect(() => {
    console.log('Starting fetch...');
    fetch(`${process.env.PUBLIC_URL}/questions.json`)

      .then(res => {
        console.log('Fetch response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Fetched data:', data);
        const formattedQuestions = data.results.map(q => {
          const options = [...q.incorrect_answers, q.correct_answer]
            .map(opt => decodeHtml(opt))
            .sort(() => Math.random() - 0.5);

          return {
            text: decodeHtml(q.question),
            options: options,
            correctIndex: options.findIndex(opt => opt === decodeHtml(q.correct_answer))
          };
        });
        setQuestions(formattedQuestions);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error caught:', err);
        setError('Failed to fetch questions. Please try again later.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (firstOptionRef.current) {
      firstOptionRef.current.focus();
    }
  }, [currentQuestionIndex]);

  function handleOptionClick(index) {
    if (!isAnswered) {
      setSelectedOption(index);
      setIsAnswered(true);

      if (index === questions[currentQuestionIndex].correctIndex) {
        setScore(prevScore => prevScore + 1);
      }
    }
  }

  function handleNext() {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizFinished(true);
    }
  }

  function handleRestart() {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsQuizFinished(false);
  }

  if (loading) {
    return (
      <div className="container center-text">
        <p>Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container center-text">
        <p>{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container center-text">
        <p>No questions available.</p>
      </div>
    );
  }

  if (isQuizFinished) {
    return (
      <div className="container center-text">
        <h2>Quiz Finished!</h2>
        <p className="feedback-text">Your score: {score} / {questions.length}</p>
        <button className="button" onClick={handleRestart}>Restart Quiz</button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="container fade-in" key={currentQuestionIndex} aria-live="polite" aria-atomic="true">
      <h2>Quiz Time!</h2>
      <p className="question-text">{currentQuestion.text}</p>
      <ul className="options-list">
        {currentQuestion.options.map((option, index) => {
          let optionClass = "option-item";
          if (isAnswered) {
            if (index === currentQuestion.correctIndex) optionClass += " option-correct";
            else if (index === selectedOption) optionClass += " option-wrong";
          }
          return (
            <li key={index}>
              <button
                ref={index === 0 ? firstOptionRef : null}
                className={optionClass}
                onClick={() => handleOptionClick(index)}
                disabled={isAnswered}
                aria-pressed={selectedOption === index}
                aria-label={`${option} ${isAnswered ? (index === currentQuestion.correctIndex ? 'Correct answer' : selectedOption === index ? 'Your answer, incorrect' : '') : ''}`}
                tabIndex="0"
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {isAnswered && (
        <>
          <p className="feedback-text">
            {selectedOption === currentQuestion.correctIndex ? "🎉 Correct!" : "❌ Incorrect!"}
          </p>
          <button className="button" onClick={handleNext}>
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </button>
        </>
      )}
    </main>
  );
}

export default App;
