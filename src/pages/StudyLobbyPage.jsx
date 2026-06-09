import React, { useState, useEffect, useRef } from 'react';
import styles from './StudyLobbyPage.module.css';
import { useStudyLobby, useStudyTasks } from '../hooks/useStudyLobby';
import BonsaiTree from '../components/BonsaiTree';
import InfoModal from '../components/InfoModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useProfiles } from '../hooks/useDatabase';
const MUSIC_THEMES = [
  {
    id: 'lofi',
    label: 'Study Lo-Fi',
    icon: '🎧',
    workQuery: 'lofi hip hop study',
    breakQuery: 'chill lofi relax',
    workStreamUrl: 'https://0nlineradio.radioho.st/0r-lo-fi?ref=radio-browser',
    breakStreamUrl: 'https://0nlineradio.radioho.st/lounge-nature-sounds',
  },
  {
    id: 'jazz',
    label: 'Slow Jazz',
    icon: '🎷',
    workQuery: 'jazz cafe study',
    breakQuery: 'smooth jazz relaxing',
    workStreamUrl: 'https://strm112.1.fm/ajazz_mobile_mp3',
    breakStreamUrl: 'https://0nlineradio.radioho.st/lounge-piano-jazz-bar',
  },
  {
    id: 'starwars',
    label: 'Epic Soundtracks',
    icon: '⚔️',
    workQuery: 'epic cinematic music',
    breakQuery: 'ambient epic music',
    workStreamUrl: 'https://stream.epic-classical.com/classical-piano',
    breakStreamUrl: 'https://azura.ebsmedia.ro/listen/movies/movies128.mp3',
  },
  {
    id: 'dark',
    label: 'Dark Aesthetic',
    icon: '🖤',
    workQuery: 'dark ambient relaxing',
    breakQuery: 'dark aesthetic relaxing',
    workStreamUrl: '/sounds/dark_academia.mp3', // Local loop downloaded specifically for this vibe
    breakStreamUrl: 'https://radio.m00.su:8000/darkambient.mp3',
  },
  {
    id: 'classical',
    label: 'Classical Focus',
    icon: '🎻',
    workQuery: 'classical music study',
    breakQuery: 'relaxing classical piano',
    workStreamUrl: 'https://az1.mediacp.eu/listen/100greatestclassicalmusic/radio.mp3',
    breakStreamUrl: 'https://air.radioart.online/fCello_for_sleep.mp3',
  },
  {
    id: 'rain',
    label: 'Rain & Nature',
    icon: '🌧️',
    workQuery: 'rain sounds focus',
    breakQuery: 'forest nature sounds',
    workStreamUrl: '/sounds/rain_loop.mp3',
    breakStreamUrl: '/sounds/rain_loop.mp3',
  },
  {
    id: 'anime',
    label: 'Anime Lo-Fi',
    icon: '🌸',
    workQuery: 'asian lofi piano',
    breakQuery: 'relaxing anime piano',
    workStreamUrl: 'https://listen.moe/stream',
    breakStreamUrl: 'https://stream.zeno.fm/qpn8mkt8c4duv',
  },
  {
    id: 'coffee',
    label: 'Coffee Shop',
    icon: '☕',
    workQuery: 'coffee shop jazz',
    breakQuery: 'cozy cafe jazz',
    workStreamUrl: 'https://0nlineradio.radioho.st/lounge-piano-jazz-bar',
    breakStreamUrl: 'https://strm112.1.fm/ajazz_mobile_mp3',
  },
];

const getTaskStatuses = (t) => [
  { id: 'todo', label: t('studyLobby.todo'), color: '#FFB74D' },
  { id: 'inprogress', label: t('studyLobby.inProgress'), color: '#42A5F5' },
  { id: 'done', label: t('studyLobby.done'), color: '#66BB6A' },
];

export default function StudyLobbyPage({ role }) {
  const {
    bonsaiXP, bonsaiStage, nextStage, sessionsCompleted, bonsaiStages,
    timerSeconds, isRunning, timerMode,
    startTimer, pauseTimer, resetTimer, skipToBreak, skipToWork,
    workDuration, setWorkDuration,
    breakDuration, setBreakDuration,
    totalCycles, setTotalCycles,
    currentCycle, sessionCompleted,
    presence, setCurrentTask,
    applyPreset,
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
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { t } = useLanguage();
  const TASK_STATUSES = getTaskStatuses(t);
  // Audio refs for sound effects
  const bellAudioRef = useRef(null);
  const hurrayAudioRef = useRef(null);

  // Play bell when timer starts, or switches modes
  useEffect(() => {
    if (isRunning && timerSeconds === (timerMode === 'work' ? workDuration : breakDuration)) {
      if (bellAudioRef.current) bellAudioRef.current.play().catch(e => console.log('Audio blocked', e));
    }
  }, [isRunning, timerMode, timerSeconds, workDuration, breakDuration]);

  // Play hurray when work completes (mode changes to break)
  useEffect(() => {
    if (timerMode === 'break' && timerSeconds === breakDuration && isRunning) {
      if (hurrayAudioRef.current) hurrayAudioRef.current.play().catch(e => console.log('Audio blocked', e));
    }
  }, [timerMode, timerSeconds, breakDuration, isRunning]);

  const partnerRole = role === 'his' ? 'her' : 'his';
  const { profile: myProfile } = useProfiles(role);
  const { profile: partnerProfile } = useProfiles(partnerRole);
  
  const partnerName = partnerProfile?.name || (role === 'his' ? 'Ana' : 'Andrei');
  const myName = myProfile?.name || (role === 'his' ? 'Andrei' : 'Ana');

  // Check partner online (within 25s)
  const partnerPresence = presence[partnerRole];
  const partnerOnline = partnerPresence?.online &&
    (Date.now() - (partnerPresence?.lastSeen || 0)) < 25000;

  const myPresence = presence[role];

  // Format seconds to MM:SS
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Timer progress
  const totalDuration = timerMode === 'work' ? workDuration : breakDuration;
  const progress = ((totalDuration - timerSeconds) / totalDuration) * 100;

  // Get current YouTube search query based on mode
  const currentQuery = timerMode === 'work'
    ? selectedMusic.workQuery
    : selectedMusic.breakQuery;

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
      <p>{t('studyLobby.preparingRoom')}</p>
    </div>;
  }

  return (
    <div className={`${styles.page} ${role === 'her' ? styles.themeHer : ''}`}>
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
        <h1 className={styles.title}>{t('studyLobby.studyRoom')}</h1>
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
            {!partnerOnline && <span className={styles.offlineLabel}>{t('studyLobby.offline')}</span>}
          </div>
        </div>
      </header>

      {/* Tab Switch */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'lobby' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('lobby')}
        >
          {t('studyLobby.lobby')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          {t('studyLobby.tasksTab')}
        </button>
      </div>

      {/* Audio Effects */}
      <audio src="/sounds/bell.mp3" ref={bellAudioRef} preload="auto" />
      <audio src="/sounds/hurray.mp3" ref={hurrayAudioRef} preload="auto" />

      {activeTab === 'lobby' ? (
        <div className={styles.lobbyContent}>
          {/* Bonsai Section */}
          <div className={styles.bonsaiSection}>
            <div className={styles.stageLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {bonsaiStage.emoji} {t(bonsaiStage.label)}
              <button onClick={() => setShowInfoModal(true)} style={{ background: 'none', border: 'none', marginLeft: '8px', fontSize: '1.2rem', cursor: 'pointer' }} aria-label="Info Bonsai">ℹ️</button>
            </div>
            <BonsaiTree stage={bonsaiStage} xp={bonsaiXP} nextStage={nextStage} />

            <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} title={t('studyLobby.bonsaiInfoTitle')}>
              <p>{t('studyLobby.bonsaiInfo1')}</p>
              <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li><b>+1 XP</b> {t('studyLobby.bonsaiInfo2a')} <b>{t('studyLobby.bonsaiInfo2b')}</b> {t('studyLobby.bonsaiInfo2c')}</li>
                <li>{t('studyLobby.bonsaiInfo3a')} <b>{t('studyLobby.bonsaiInfo3b')}</b>{t('studyLobby.bonsaiInfo3c')}<b>{t('studyLobby.bonsaiInfo3d')}</b>{t('studyLobby.bonsaiInfo3e')}</li>
                <li>{t('studyLobby.bonsaiInfo4')}</li>
              </ul>
              <p style={{ marginTop: '10px' }}><i>{t('studyLobby.bonsaiInfo5')}</i></p>
            </InfoModal>
            <div className={styles.sessionsCount}>
              🎯 {sessionsCompleted} {t('studyLobby.sessionsCompletedText')}
              {partnerOnline && <span className={styles.bonusTag}>{t('studyLobby.bonusCoStudy')}</span>}
            </div>
          </div>

          {/* Config Panel (only when stopped at the beginning of a cycle) */}
          {!isRunning && !sessionCompleted && timerMode === 'work' && currentCycle === 1 && (
            <div className={styles.timerConfigPanel}>
              <h4>{t('studyLobby.sessionSettings')}</h4>
              <div className={styles.configPresets}>
                <button 
                  className={workDuration === 25*60 && breakDuration === 5*60 ? styles.presetActive : ''}
                  onClick={() => applyPreset(25*60, 5*60)}
                >
                  25 / 5
                </button>
                <button 
                  className={workDuration === 50*60 && breakDuration === 10*60 ? styles.presetActive : ''}
                  onClick={() => applyPreset(50*60, 10*60)}
                >
                  50 / 10
                </button>
              </div>
              <div className={styles.configCustom}>
                <div className={styles.stepperGroup}>
                  <label>{t('studyLobby.workMin')}</label>
                  <div className={styles.stepper}>
                    <button onClick={() => setWorkDuration(Math.max(60, workDuration - 60))}>-</button>
                    <span>{workDuration/60}</span>
                    <button onClick={() => setWorkDuration(Math.min(120*60, workDuration + 60))}>+</button>
                  </div>
                </div>
                <div className={styles.stepperGroup}>
                  <label>{t('studyLobby.breakMin')}</label>
                  <div className={styles.stepper}>
                    <button onClick={() => setBreakDuration(Math.max(60, breakDuration - 60))}>-</button>
                    <span>{breakDuration/60}</span>
                    <button onClick={() => setBreakDuration(Math.min(60*60, breakDuration + 60))}>+</button>
                  </div>
                </div>
                <div className={styles.stepperGroup}>
                  <label>{t('studyLobby.cycles')}</label>
                  <div className={styles.stepper}>
                    <button onClick={() => setTotalCycles(Math.max(1, totalCycles - 1))}>-</button>
                    <span>{totalCycles}</span>
                    <button onClick={() => setTotalCycles(Math.min(10, totalCycles + 1))}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timer Section */}
          <div className={`${styles.timerSection} ${timerMode === 'break' ? styles.breakMode : ''}`}>
            {sessionCompleted ? (
              <div className={styles.sessionCompletePopup}>
                <h2 className={styles.hurrayText}>{t('studyLobby.hurray')}</h2>
                <p>{t('studyLobby.finishedAllCycles1')}{totalCycles}{t('studyLobby.finishedAllCycles2')}</p>
                <button className={styles.resetBtn} onClick={resetTimer}>{t('studyLobby.startNewSession')}</button>
              </div>
            ) : (
              <>
                <div className={styles.timerModeLabel}>
                  {timerMode === 'work' ? t('studyLobby.focusTime') : t('studyLobby.breakTime')}
                  <span className={styles.cycleBadge}>{t('studyLobby.cycle')} {currentCycle} {t('studyLobby.of')} {totalCycles}</span>
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
                      {timerMode === 'work' ? `${workDuration/60} ${t('studyLobby.minFocus')}` : `${breakDuration/60} ${t('studyLobby.minBreak')}`}
                    </span>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className={styles.timerControls}>
                  {!isRunning ? (
                    <button className={styles.playBtn} onClick={() => {
                      startTimer();
                      setIsMusicPlaying(true);
                    }}>
                      {t('studyLobby.start')}
                    </button>
                  ) : (
                    <button className={styles.pauseBtn} onClick={pauseTimer}>
                      {t('studyLobby.pause')}
                    </button>
                  )}
                  <button className={styles.resetBtn} onClick={resetTimer}>
                    {t('studyLobby.reset')}
                  </button>
                  {timerMode === 'work' ? (
                    <button className={styles.skipBtn} onClick={skipToBreak}>
                      {t('studyLobby.skipToBreak')}
                    </button>
                  ) : (
                    <button className={styles.skipBtn} onClick={skipToWork}>
                      {t('studyLobby.skipToWork')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Music Section */}
          <div className={styles.musicSection}>
            <div className={styles.musicHeader}>
              <h3 className={styles.musicTitle}>{t('studyLobby.music')}</h3>
              <button
                className={styles.musicToggle}
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
              >
                {isMusicPlaying ? t('studyLobby.on') : t('studyLobby.off')}
              </button>
            </div>

            {/* Music Theme Picker */}
            <button
              className={styles.currentTheme}
              onClick={() => setShowMusicPicker(!showMusicPicker)}
            >
              <span>{selectedMusic.icon} {selectedMusic.label}</span>
              <span className={styles.changeLabel}>{t('studyLobby.change')}</span>
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

            {/* Direct Web Stream Audio Player */}
            {isMusicPlaying && (
              <div className={styles.customAudioPlayer}>
                <div className={styles.vinylWrapper}>
                  <div className={`${styles.vinyl} ${styles.spinning}`}>
                    <span className={styles.vinylCenter}>{selectedMusic.icon}</span>
                  </div>
                </div>
                <div className={styles.audioControls}>
                  <div className={styles.nowPlayingInfo}>
                    <strong>{selectedMusic.label}</strong>
                    <span>{t('studyLobby.radioLoop')}</span>
                  </div>
                  <audio
                    key={`${selectedMusic.id}-${timerMode}`} // Reload when theme or mode changes
                    src={timerMode === 'work' ? selectedMusic.workStreamUrl : selectedMusic.breakStreamUrl}
                    autoPlay
                    loop
                    controls
                    controlsList="nodownload noplaybackrate"
                    className={styles.nativeAudio}
                  >
                    {t('studyLobby.audioNotSupported')}
                  </audio>
                </div>
              </div>
            )}

            {/* Fallback: open YouTube directly */}
            <button
              className={styles.openYoutubeBtn}
              onClick={() => {
                const q = timerMode === 'work' ? selectedMusic.workQuery : selectedMusic.breakQuery;
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
              }}
            >
              {t('studyLobby.searchYoutube')}
            </button>
          </div>
        </div>
      ) : (
        /* Task Board Tab */
        <div className={styles.taskBoard}>
          {/* My Tasks */}
          <div className={styles.taskColumn}>
            <div className={styles.taskColumnHeader}>
              <h3>{myProfile?.gender === 'F' ? '👩‍🦰' : '🧔‍♂️'} {t('studyLobby.myTasks')}</h3>
              <button className={styles.addTaskBtn} onClick={() => setShowAddTask(!showAddTask)}>+</button>
            </div>

            {showAddTask && (
              <div className={styles.addTaskForm}>
                <input
                  type="text"
                  placeholder={t('studyLobby.whatToDo')}
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTask()}
                  className={styles.taskInput}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder={t('studyLobby.subjectOptional')}
                  value={newTaskSubject}
                  onChange={e => setNewTaskSubject(e.target.value)}
                  className={styles.taskInput}
                />
                <button className={styles.saveTaskBtn} onClick={handleAddTask}>{t('studyLobby.addBtn')}</button>
              </div>
            )}

            {myTasks.length === 0 && !showAddTask && (
              <p className={styles.emptyTasks}>{t('studyLobby.noTasksYet')}</p>
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
                    if (window.confirm(t('studyLobby.deleteTaskPrompt'))) deleteTask(task.id);
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
              <h3>{partnerProfile?.gender === 'F' ? '👩‍🦰' : '🧔‍♂️'} {partnerName}</h3>
            </div>

            {partnerTasks.length === 0 && (
              <p className={styles.emptyTasks}>{partnerName} {t('studyLobby.partnerNoTasks')}</p>
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
