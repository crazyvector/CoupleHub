import React, { useState, useEffect, useRef } from 'react';
import styles from './StudyLobbyPage.module.css';
import { useStudyLobby, useStudyTasks } from '../hooks/useStudyLobby';
import BonsaiTree from '../components/BonsaiTree';

const MUSIC_THEMES = [
  {
    id: 'lofi',
    label: 'Study Lo-Fi',
    icon: '🎧',
    workPlaylist: 'jfKfPfyJRdk', // lofi girl
    breakPlaylist: 'rUxyKA_-grg',
  },
  {
    id: 'jazz',
    label: 'Slow Jazz',
    icon: '🎷',
    workPlaylist: 'Dx5qFachd3A',
    breakPlaylist: 'fEvM-OUbaKs',
  },
  {
    id: 'starwars',
    label: 'Star Wars Lo-Fi',
    icon: '⚔️',
    workPlaylist: 'ck4GCkMPifQ',
    breakPlaylist: 'cGYyOY4jI_0',
  },
  {
    id: 'dark',
    label: 'Dark Aesthetic',
    icon: '🖤',
    workPlaylist: '4hOKk-cDzOw',
    breakPlaylist: 'OsQsG-JYqXw',
  },
  {
    id: 'classical',
    label: 'Classical Focus',
    icon: '🎻',
    workPlaylist: 'jgpJVI3tDbY',
    breakPlaylist: 'JKriGqH7208',
  },
  {
    id: 'rain',
    label: 'Rain & Nature',
    icon: '🌧️',
    workPlaylist: 'HEP0IEMIz0M',
    breakPlaylist: 'HEP0IEMIz0M',
  },
  {
    id: 'anime',
    label: 'Anime Lo-Fi',
    icon: '🌸',
    workPlaylist: 'WDXPJWIgX-o',
    breakPlaylist: 'v4VE5WjNuMA',
  },
  {
    id: 'coffee',
    label: 'Coffee Shop',
    icon: '☕',
    workPlaylist: 'h2zkV-l_TbY',
    breakPlaylist: 'RUogeaUOljA',
  },
];

const TASK_STATUSES = [
  { id: 'todo', label: 'De făcut', color: '#FFB74D' },
  { id: 'inprogress', label: 'În lucru', color: '#42A5F5' },
  { id: 'done', label: 'Gata ✓', color: '#66BB6A' },
];

export default function StudyLobbyPage({ role }) {
  const {
    bonsaiXP, bonsaiStage, nextStage, sessionsCompleted, bonsaiStages,
    timerSeconds, isRunning, timerMode,
    startTimer, pauseTimer, resetTimer, skipToBreak, skipToWork,
    WORK_DURATION, BREAK_DURATION,
    presence, setCurrentTask,
    loading: lobbyLoading,
  } = useStudyLobby(role);

  const { tasks, addTask, updateTask, deleteTask, loading: tasksLoading } = useStudyTasks();

  const [selectedMusic, setSelectedMusic] = useState(MUSIC_THEMES[0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [activeTab, setActiveTab] = useState('lobby'); // 'lobby' or 'tasks'

  const partnerRole = role === 'his' ? 'her' : 'his';
  const partnerName = role === 'his' ? 'Ana' : 'Andrei';
  const myName = role === 'his' ? 'Andrei' : 'Ana';

  // Check partner online (within 60s)
  const partnerPresence = presence[partnerRole];
  const partnerOnline = partnerPresence?.online &&
    (Date.now() - (partnerPresence?.lastSeen || 0)) < 60000;

  const myPresence = presence[role];

  // Format seconds to MM:SS
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Timer progress
  const totalDuration = timerMode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = ((totalDuration - timerSeconds) / totalDuration) * 100;

  // Get current YouTube video ID based on mode
  const currentVideoId = timerMode === 'work'
    ? selectedMusic.workPlaylist
    : selectedMusic.breakPlaylist;

  // My tasks and partner tasks
  const myTasks = tasks.filter(t => t.owner === role);
  const partnerTasks = tasks.filter(t => t.owner === partnerRole);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    addTask({
      title: newTaskTitle.trim(),
      subject: newTaskSubject.trim() || null,
      status: 'todo',
      owner: role,
    });
    setNewTaskTitle('');
    setNewTaskSubject('');
    setShowAddTask(false);
  };

  const cycleStatus = (task) => {
    const order = ['todo', 'inprogress', 'done'];
    const idx = order.indexOf(task.status);
    const next = order[(idx + 1) % order.length];
    updateTask(task.id, { status: next });

    if (next === 'inprogress') {
      setCurrentTask(task.title);
    } else if (task.status === 'inprogress') {
      setCurrentTask(null);
    }
  };

  if (lobbyLoading) {
    return <div className={styles.loadingScreen}>
      <span className={styles.loadingEmoji}>📚</span>
      <p>Se pregătește sala de studiu...</p>
    </div>;
  }

  return (
    <div className={styles.page}>
      {/* Ambient Background */}
      <div className={styles.ambientBg}>
        <div className={styles.star} style={{ top: '10%', left: '15%', animationDelay: '0s' }}></div>
        <div className={styles.star} style={{ top: '20%', right: '20%', animationDelay: '1s' }}></div>
        <div className={styles.star} style={{ top: '35%', left: '70%', animationDelay: '2s' }}></div>
        <div className={styles.star} style={{ top: '50%', left: '30%', animationDelay: '0.5s' }}></div>
        <div className={styles.star} style={{ top: '15%', left: '50%', animationDelay: '1.5s' }}></div>
        <div className={styles.star} style={{ top: '60%', right: '15%', animationDelay: '2.5s' }}></div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>📚 Sala de Studiu</h1>
        <div className={styles.presenceRow}>
          <div className={`${styles.presenceChip} ${styles.online}`}>
            <span className={styles.presenceDot}></span>
            <span>{myName}</span>
            {myPresence?.currentTask && (
              <span className={styles.taskTag}>📖 {myPresence.currentTask}</span>
            )}
          </div>
          <div className={`${styles.presenceChip} ${partnerOnline ? styles.online : styles.offline}`}>
            <span className={styles.presenceDot}></span>
            <span>{partnerName}</span>
            {partnerOnline && partnerPresence?.currentTask && (
              <span className={styles.taskTag}>📖 {partnerPresence.currentTask}</span>
            )}
            {!partnerOnline && <span className={styles.offlineLabel}>offline</span>}
          </div>
        </div>
      </header>

      {/* Tab Switch */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'lobby' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('lobby')}
        >
          🌳 Lobby
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 Task-uri
        </button>
      </div>

      {activeTab === 'lobby' ? (
        <div className={styles.lobbyContent}>
          {/* Bonsai Section */}
          <div className={styles.bonsaiSection}>
            <div className={styles.stageLabel}>
              {bonsaiStage.emoji} {bonsaiStage.label}
            </div>
            <BonsaiTree stage={bonsaiStage} xp={bonsaiXP} nextStage={nextStage} />
            <div className={styles.sessionsCount}>
              🎯 {sessionsCompleted} sesiuni completate
              {partnerOnline && <span className={styles.bonusTag}>+50% XP bonus co-study!</span>}
            </div>
          </div>

          {/* Timer Section */}
          <div className={`${styles.timerSection} ${timerMode === 'break' ? styles.breakMode : ''}`}>
            <div className={styles.timerModeLabel}>
              {timerMode === 'work' ? '💻 Focus Time' : '☕ Pauză'}
            </div>

            {/* Circular progress */}
            <div className={styles.timerCircle}>
              <svg viewBox="0 0 120 120" className={styles.timerSvg}>
                <circle cx="60" cy="60" r="54" className={styles.timerTrack} />
                <circle
                  cx="60" cy="60" r="54"
                  className={styles.timerProgress}
                  style={{
                    strokeDasharray: `${2 * Math.PI * 54}`,
                    strokeDashoffset: `${2 * Math.PI * 54 * (1 - progress / 100)}`,
                  }}
                />
              </svg>
              <div className={styles.timerText}>
                <span className={styles.timerDigits}>{formatTime(timerSeconds)}</span>
                <span className={styles.timerSubtext}>
                  {timerMode === 'work' ? '50 min focus' : '10 min pauză'}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className={styles.timerControls}>
              {!isRunning ? (
                <button className={styles.playBtn} onClick={startTimer}>▶️</button>
              ) : (
                <button className={styles.pauseBtn} onClick={pauseTimer}>⏸️</button>
              )}
              <button className={styles.resetBtn} onClick={resetTimer}>⏹️</button>
              {timerMode === 'work' ? (
                <button className={styles.skipBtn} onClick={skipToBreak}>⏭️ Pauză</button>
              ) : (
                <button className={styles.skipBtn} onClick={skipToWork}>⏭️ Focus</button>
              )}
            </div>
          </div>

          {/* Music Section */}
          <div className={styles.musicSection}>
            <div className={styles.musicHeader}>
              <h3 className={styles.musicTitle}>🎵 Muzică</h3>
              <button
                className={styles.musicToggle}
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
              >
                {isMusicPlaying ? '🔊 On' : '🔇 Off'}
              </button>
            </div>

            {/* Music Theme Picker */}
            <button
              className={styles.currentTheme}
              onClick={() => setShowMusicPicker(!showMusicPicker)}
            >
              <span>{selectedMusic.icon} {selectedMusic.label}</span>
              <span className={styles.changeLabel}>Schimbă ▾</span>
            </button>

            {showMusicPicker && (
              <div className={styles.themePicker}>
                {MUSIC_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    className={`${styles.themeOption} ${selectedMusic.id === theme.id ? styles.themeActive : ''}`}
                    onClick={() => {
                      setSelectedMusic(theme);
                      setShowMusicPicker(false);
                    }}
                  >
                    <span>{theme.icon}</span>
                    <span>{theme.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* YouTube Embed */}
            {isMusicPlaying && (
              <div className={styles.youtubeEmbed}>
                <iframe
                  width="100%"
                  height="60"
                  src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&loop=1`}
                  title="Study Music"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  style={{ borderRadius: '12px', opacity: 0.9 }}
                ></iframe>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Task Board Tab */
        <div className={styles.taskBoard}>
          {/* My Tasks */}
          <div className={styles.taskColumn}>
            <div className={styles.taskColumnHeader}>
              <h3>{role === 'his' ? '🧔‍♂️' : '👩‍🦰'} Task-urile mele</h3>
              <button className={styles.addTaskBtn} onClick={() => setShowAddTask(!showAddTask)}>+</button>
            </div>

            {showAddTask && (
              <div className={styles.addTaskForm}>
                <input
                  type="text"
                  placeholder="Ce ai de făcut?"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTask()}
                  className={styles.taskInput}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Materie / Subiect (opțional)"
                  value={newTaskSubject}
                  onChange={e => setNewTaskSubject(e.target.value)}
                  className={styles.taskInput}
                />
                <button className={styles.saveTaskBtn} onClick={handleAddTask}>Adaugă</button>
              </div>
            )}

            {myTasks.length === 0 && !showAddTask && (
              <p className={styles.emptyTasks}>Niciun task încă. Adaugă unul! 📝</p>
            )}

            {myTasks.map(task => (
              <div key={task.id} className={`${styles.taskCard} ${styles[`task_${task.status}`]}`}>
                <div className={styles.taskTop}>
                  <button
                    className={styles.statusBtn}
                    onClick={() => cycleStatus(task)}
                    style={{ borderColor: TASK_STATUSES.find(s => s.id === task.status)?.color }}
                  >
                    {TASK_STATUSES.find(s => s.id === task.status)?.label}
                  </button>
                  <button className={styles.deleteTaskBtn} onClick={() => {
                    if (window.confirm('Ștergi acest task?')) deleteTask(task.id);
                  }}>✕</button>
                </div>
                <p className={styles.taskTitle}>{task.title}</p>
                {task.subject && <span className={styles.subjectTag}>📚 {task.subject}</span>}
              </div>
            ))}
          </div>

          {/* Partner Tasks */}
          <div className={styles.taskColumn}>
            <div className={styles.taskColumnHeader}>
              <h3>{partnerRole === 'his' ? '🧔‍♂️' : '👩‍🦰'} {partnerName}</h3>
            </div>

            {partnerTasks.length === 0 && (
              <p className={styles.emptyTasks}>{partnerName} nu are task-uri încă.</p>
            )}

            {partnerTasks.map(task => (
              <div key={task.id} className={`${styles.taskCard} ${styles[`task_${task.status}`]} ${styles.partnerTask}`}>
                <div className={styles.taskTop}>
                  <span
                    className={styles.statusBadge}
                    style={{ background: TASK_STATUSES.find(s => s.id === task.status)?.color }}
                  >
                    {TASK_STATUSES.find(s => s.id === task.status)?.label}
                  </span>
                </div>
                <p className={styles.taskTitle}>{task.title}</p>
                {task.subject && <span className={styles.subjectTag}>📚 {task.subject}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom spacer for nav */}
      <div style={{ height: '90px' }}></div>
    </div>
  );
}
