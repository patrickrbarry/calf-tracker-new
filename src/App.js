import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Calendar, Bell } from 'lucide-react';
import './App.css';

const CalfStretchingTracker = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentLeg, setCurrentLeg] = useState('left');
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSession, setCurrentSession] = useState(1);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [reminders, setReminders] = useState([
    { id: 1, time: '08:00', enabled: true, label: 'Morning' },
    { id: 2, time: '12:00', enabled: true, label: 'Lunch' },
    { id: 3, time: '17:00', enabled: true, label: 'Evening' },
    { id: 4, time: '21:00', enabled: false, label: 'Night' }
  ]);
  
  const intervalRef = useRef(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const sampleSessions = [
      { date: today, completed: currentSession - 1, target: 4 }
    ];
    setSessions(sampleSessions);
  }, [currentSession]);

  useEffect(() => {
    const handleTimerComplete = () => {
      if (currentLeg === 'left') {
        setCurrentLeg('right');
        setTimeLeft(30);
      } else {
        if (currentRep < 6) {
          setCurrentRep(prev => prev + 1);
          setCurrentLeg('left');
          setTimeLeft(30);
        } else {
          setIsRunning(false);
          setIsSessionComplete(true);
          updateSessionHistory();
        }
      }
    };

    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, currentLeg, currentRep]);

  const updateSessionHistory = () => {
    const today = new Date().toDateString();
    setSessions(prev => {
      const todaySession = prev.find(s => s.date === today);
      if (todaySession) {
        return prev.map(s => 
          s.date === today 
            ? { ...s, completed: Math.min(s.completed + 1, s.target) }
            : s
        );
      } else {
        return [...prev, { date: today, completed: 1, target: 4 }];
      }
    });
  };

  const startPauseTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetSession = () => {
    setIsRunning(false);
    setTimeLeft(30);
    setCurrentLeg('left');
    setCurrentRep(1);
    setIsSessionComplete(false);
  };

  const startNewSession = () => {
    resetSession();
    setCurrentSession(prev => Math.min(prev + 1, 4));
    setIsSessionComplete(false);
  };

  const getProgressPercentage = () => {
    const totalSteps = 12;
    const completedSteps = (currentRep - 1) * 2 + (currentLeg === 'right' ? 1 : 0);
    return (completedSteps / totalSteps) * 100;
  };

  const formatTime = (seconds) => {
    return seconds.toString().padStart(2, '0');
  };

  const getDailyProgress = () => {
    const today = new Date().toDateString();
    const todaySession = sessions.find(s => s.date === today);
    return todaySession ? `${todaySession.completed}/${todaySession.target}` : '0/4';
  };

  const getStreak = () => {
    return sessions.length;
  };

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, enabled: !reminder.enabled }
        : reminder
    ));
  };

  const updateReminderTime = (id, newTime) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id 
        ? { ...reminder, time: newTime }
        : reminder
    ));
  };

  if (showHistory) {
    return (
      <div className="app-container">
        <div className="card-container">
          <div className="card">
            <div className="header">
              <h2 className="title">History</h2>
              <button onClick={() => setShowHistory(false)} className="back-button">
                Back
              </button>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card blue">
                <div className="stat-label">Current Streak</div>
                <div className="stat-value">{getStreak()} days</div>
              </div>
              
              <div className="stat-card green">
                <div className="stat-label">Today's Progress</div>
                <div className="stat-value">{getDailyProgress()}</div>
              </div>
              
              <div className="history-section">
                <h3 className="section-title">Recent Sessions</h3>
                {sessions.map((session, index) => (
                  <div key={index} className="session-row">
                    <span className="session-date">{session.date}</span>
                    <span className={`session-progress ${session.completed >= session.target ? 'complete' : 'incomplete'}`}>
                      {session.completed}/{session.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showReminders) {
    return (
      <div className="app-container">
        <div className="card-container">
          <div className="card">
            <div className="header">
              <h2 className="title">Reminders</h2>
              <button onClick={() => setShowReminders(false)} className="back-button">
                Back
              </button>
            </div>
            
            <div className="reminders-section">
              <p className="reminders-description">
                Set up to 4 daily reminders for your stretching sessions
              </p>
              
              {reminders.map((reminder) => (
                <div key={reminder.id} className="reminder-card">
                  <div className="reminder-header">
                    <div className="reminder-info">
                      <div className="reminder-label">{reminder.label}</div>
                      <div className={`reminder-status ${reminder.enabled ? 'on' : 'off'}`}>
                        {reminder.enabled ? 'ON' : 'OFF'}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`toggle-switch ${reminder.enabled ? 'enabled' : 'disabled'}`}
                    >
                      <div className="toggle-knob"></div>
                    </button>
                  </div>
                  
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => updateReminderTime(reminder.id, e.target.value)}
                    className="time-input"
                    disabled={!reminder.enabled}
                  />
                </div>
              ))}
              
              <div className="notification-tip">
                <div className="tip-header">
                  <Bell size={16} />
                  <span>Notification Tip</span>
                </div>
                <p>Make sure to allow notifications in your device settings for the best reminder experience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="app-container">
        <div className="card-container">
          <div className="completion-card">
            <div className="celebration">🎉</div>
            <h2 className="completion-title">Session Complete!</h2>
            <p className="completion-message">Great job completing your stretching routine</p>
            
            <div className="stat-card green">
              <div className="stat-label">Today's Progress</div>
              <div className="stat-value">{getDailyProgress()}</div>
            </div>
            
            <div className="button-group">
              <button onClick={startNewSession} className="primary-button">
                Start Next Session
              </button>
              <button onClick={() => setShowHistory(true)} className="secondary-button">
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="card-container">
        <div className="app-header">
          <h1 className="app-title">Calf Stretching</h1>
          <div className="session-info">
            Session {currentSession}/4 • Today: {getDailyProgress()}
          </div>
        </div>

        <div className="timer-card">
          <div className="leg-indicator">
            <div className="leg-label">Current Leg</div>
            <div className={`leg-display ${currentLeg}`}>
              {currentLeg.toUpperCase()}
            </div>
          </div>

          <div className="timer-display">
            <div className="timer-number">{formatTime(timeLeft)}</div>
            <div className="timer-label">seconds</div>
          </div>

          <div className="progress-section">
            <div className="progress-info">
              <span>Rep {currentRep}/6</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="control-buttons">
            <button
              onClick={startPauseTimer}
              className={`control-button ${isRunning ? 'pause' : 'play'}`}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            
            <button onClick={resetSession} className="reset-button">
              <RotateCcw size={24} />
            </button>
          </div>
        </div>

        <div className="bottom-nav">
          <button onClick={() => setShowHistory(true)} className="nav-button">
            <Calendar size={20} />
            <span>History</span>
          </button>
          
          <button onClick={() => setShowReminders(true)} className="nav-button">
            <Bell size={20} />
            <span>Reminders</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalfStretchingTracker;