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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const intervalRef = useRef(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    loadStoredData();
    checkNotificationPermission();
    scheduleNotifications();
  }, []);

  // Save data whenever sessions or reminders change
  useEffect(() => {
    saveToStorage('sessions', sessions);
  }, [sessions]);

  useEffect(() => {
    saveToStorage('reminders', reminders);
    scheduleNotifications();
  }, [reminders]);

  // Load stored data
  const loadStoredData = () => {
    try {
      // Load sessions
      const storedSessions = getFromStorage('sessions');
      if (storedSessions) {
        setSessions(storedSessions);
        
        // Calculate today's current session
        const today = new Date().toDateString();
        const todaySession = storedSessions.find(s => s.date === today);
        if (todaySession) {
          setCurrentSession(todaySession.completed + 1);
        }
      } else {
        // Initialize with today's data
        const today = new Date().toDateString();
        const initialSessions = [{ date: today, completed: 0, target: 4 }];
        setSessions(initialSessions);
      }

      // Load reminders
      const storedReminders = getFromStorage('reminders');
      if (storedReminders) {
        setReminders(storedReminders);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  // Storage helpers
  const saveToStorage = (key, data) => {
    try {
      localStorage.setItem(`calfTracker_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  };

  const getFromStorage = (key) => {
    try {
      const item = localStorage.getItem(`calfTracker_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  };

  // Notification functions
  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const scheduleNotifications = () => {
    if (!notificationsEnabled) return;
    
    // Clear existing timeouts
    const existingTimeouts = getFromStorage('notificationTimeouts') || [];
    existingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    
    const newTimeouts = [];
    
    reminders.forEach(reminder => {
      if (reminder.enabled) {
        const [hours, minutes] = reminder.time.split(':');
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // If the time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const timeUntilNotification = scheduledTime.getTime() - now.getTime();
        
        const timeoutId = setTimeout(() => {
          showNotification(`Time for your ${reminder.label.toLowerCase()} calf stretching session!`);
          // Reschedule for next day
          scheduleNotifications();
        }, timeUntilNotification);
        
        newTimeouts.push(timeoutId);
      }
    });
    
    saveToStorage('notificationTimeouts', newTimeouts);
  };

  const showNotification = (message) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification('Calf Stretching Reminder', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  // Timer logic
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
    // Calculate consecutive days with completed sessions
    const sortedSessions = sessions
      .filter(s => s.completed >= s.target)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedSessions.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = (currentDate - sessionDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const toggleReminder = async (id) => {
    // Request notification permission if enabling reminders
    if (!notificationsEnabled) {
      await checkNotificationPermission();
    }
    
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

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all session history? This cannot be undone.')) {
      localStorage.removeItem('calfTracker_sessions');
      localStorage.removeItem('calfTracker_reminders');
      setSessions([{ date: new Date().toDateString(), completed: 0, target: 4 }]);
      setCurrentSession(1);
    }
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
                {sessions.slice().reverse().map((session, index) => (
                  <div key={index} className="session-row">
                    <span className="session-date">{session.date}</span>
                    <span className={`session-progress ${session.completed >= session.target ? 'complete' : 'incomplete'}`}>
                      {session.completed}/{session.target}
                    </span>
                  </div>
                ))}
                
                <button onClick={clearAllData} className="secondary-button" style={{marginTop: '1rem'}}>
                  Clear All History
                </button>
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
              
              {!notificationsEnabled && (
                <div className="notification-warning">
                  <p>⚠️ Notifications are not enabled. Please allow notifications in your browser settings for reminders to work.</p>
                  <button onClick={checkNotificationPermission} className="primary-button">
                    Enable Notifications
                  </button>
                </div>
              )}
              
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
                  <span>Notification Status</span>
                </div>
                <p>Notifications are {notificationsEnabled ? 'enabled' : 'disabled'}. 
                   {!notificationsEnabled && ' Please enable them in your browser/device settings.'}</p>
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