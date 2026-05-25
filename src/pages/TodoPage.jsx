import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTodos } from '../hooks/useDatabase';
import styles from './TodoPage.module.css';

const PREDEFINED_CATEGORIES = ['General', 'Casă 🏠', 'Muncă 💼', 'Cumpărături 🛒', 'Sănătate 💊', 'Iubire ❤️'];

export default function TodoPage({ role }) {
  const { todos, addTodo, updateTodo, toggleTodoStatus, deleteTodo, loading } = useTodos(role);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('importance'); // 'importance', 'deadline', 'dateAdded', 'name', 'category'
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState('medium'); // 'high', 'medium', 'low'
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const resizeImage = (file, maxWidth, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const base64Url = await resizeImage(file, 800, 0.6);
      setImage(base64Url);
    } catch (err) {
      console.error(err);
      alert('Eroare la încărcarea imaginii.');
    }
    setIsUploading(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImportance('medium');
    setCategory('General');
    setCustomCategory('');
    setDeadline('');
    setImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (todo) => {
    setEditingId(todo.id);
    setTitle(todo.title || '');
    setDescription(todo.description || '');
    setImportance(todo.importance || 'medium');
    
    // Check if category is predefined
    const cat = todo.category || 'General';
    if (PREDEFINED_CATEGORIES.includes(cat)) {
      setCategory(cat);
      setCustomCategory('');
    } else {
      setCategory('Altele');
      setCustomCategory(cat);
    }
    
    setDeadline(todo.deadline || '');
    setImage(todo.image || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = category === 'Altele' ? (customCategory.trim() || 'General') : category;

    const data = {
      title: title.trim(),
      description: description.trim(),
      importance,
      category: finalCategory,
      deadline,
      image
    };

    if (editingId) {
      await updateTodo(editingId, data);
    } else {
      await addTodo(data);
    }
    setIsModalOpen(false);
  };

  const activeTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);
  const displayedTodos = activeTab === 'active' ? activeTodos : completedTodos;

  const importanceOrder = { high: 3, medium: 2, low: 1 };

  // Sorting Logic
  displayedTodos.sort((a, b) => {
    if (sortBy === 'importance') {
      if (importanceOrder[b.importance] !== importanceOrder[a.importance]) {
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      }
      // fallback to deadline then date added
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      if (a.deadline && b.deadline && a.deadline !== b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    
    if (sortBy === 'deadline') {
      if (!a.deadline && !b.deadline) return new Date(b.createdAt) - new Date(a.createdAt);
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    
    if (sortBy === 'dateAdded') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    
    if (sortBy === 'name') {
      return a.title.localeCompare(b.title);
    }
    
    if (sortBy === 'category') {
      const catA = a.category || 'General';
      const catB = b.category || 'General';
      if (catA !== catB) return catA.localeCompare(catB);
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    }
    
    return 0;
  });

  const getDeadlineStatus = (deadlineStr) => {
    if (!deadlineStr) return null;
    const d = new Date(deadlineStr);
    const now = new Date();
    const diff = d - now;
    
    if (diff < 0) return { text: 'Expirat ⚠️', isSafe: false };
    if (diff < 24 * 60 * 60 * 1000) return { text: 'Azi 🚨', isSafe: false };
    return { text: d.toLocaleDateString('ro-RO'), isSafe: true };
  };

  if (loading) {
    return <div className={styles.page}><p>Încărcare...</p></div>;
  }

  return (
    <div className={`${styles.page} animate-fade-in`}>
      <header className={styles.header}>
        <h1 className={styles.title}>📝 To-Do List</h1>
        <p className={styles.subtitle}>Task-urile tale personale</p>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activeTodos.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Istoric ({completedTodos.length})
        </button>
      </div>
      
      <div className={styles.controlsRow}>
        <select 
          className={styles.sortSelect} 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="importance">🔥 Sortare: Importanță</option>
          <option value="deadline">⏰ Sortare: Deadline</option>
          <option value="category">📂 Sortare: Categorie</option>
          <option value="dateAdded">📅 Sortare: Dată Adăugare</option>
          <option value="name">🔤 Sortare: Nume</option>
        </select>
      </div>

      <button className={styles.addButton} onClick={openAddModal}>
        ➕ Adaugă un task nou
      </button>

      <div className={styles.list}>
        {displayedTodos.length === 0 ? (
          <div className={styles.emptyState}>
            {activeTab === 'active' ? 'Nu ai niciun task activ. Yay! 🎉' : 'Nu ai niciun task finalizat încă.'}
          </div>
        ) : (
          displayedTodos.map(todo => {
            const dlStatus = getDeadlineStatus(todo.deadline);
            return (
              <div 
                key={todo.id} 
                className={`${styles.taskCard} ${todo.isCompleted ? styles.taskCardCompleted : ''} ${
                  todo.importance === 'high' ? styles.priorityHigh :
                  todo.importance === 'medium' ? styles.priorityMedium : styles.priorityLow
                } animate-scale-in`}
                onClick={() => openEditModal(todo)}
              >
                <div className={styles.checkCol} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className={`${styles.checkBtn} ${todo.isCompleted ? styles.checkBtnChecked : ''}`}
                    onClick={() => toggleTodoStatus(todo.id, todo.isCompleted)}
                  >
                    {todo.isCompleted && '✓'}
                  </button>
                </div>
                <div className={styles.contentCol}>
                  <div className={styles.badgeContainer}>
                    {todo.category && (
                      <span className={styles.categoryBadge}>{todo.category}</span>
                    )}
                    {dlStatus && !todo.isCompleted && (
                      <span className={`${styles.deadlineBadge} ${dlStatus.isSafe ? styles.deadlineBadgeSafe : ''}`}>
                        ⏳ {dlStatus.text}
                      </span>
                    )}
                  </div>
                  
                  <h3 className={styles.taskTitle} style={{ textDecoration: todo.isCompleted ? 'line-through' : 'none' }}>
                    {todo.title}
                  </h3>
                  {todo.description && <p className={styles.taskDesc}>{todo.description}</p>}
                  {todo.image && <img src={todo.image} alt="Task" className={styles.taskImage} />}
                  
                  <div className={styles.taskMeta}>
                    <span>Importanță: {todo.importance === 'high' ? '🔥 Mare' : todo.importance === 'medium' ? '⭐ Medie' : '🧊 Mică'}</span>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }}
                      aria-label="Șterge"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && createPortal(
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={`${styles.modalContent} animate-scale-in`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? 'Editează Task' : 'Task Nou'}</h2>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.formField}>
                <label>Titlu *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className={styles.input} 
                  placeholder="Ex: Cumpără flori" 
                  required 
                />
              </div>

              <div className={styles.formField}>
                <label>Grupă / Categorie</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.input}
                >
                  {PREDEFINED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="Altele">Altă categorie...</option>
                </select>
                {category === 'Altele' && (
                  <input 
                    type="text" 
                    value={customCategory} 
                    onChange={e => setCustomCategory(e.target.value)} 
                    className={styles.input} 
                    placeholder="Nume categorie nouă..." 
                    style={{ marginTop: '10px' }}
                    required 
                  />
                )}
              </div>

              <div className={styles.formField}>
                <label>Termen limită (Deadline)</label>
                <input 
                  type="datetime-local" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  className={styles.input} 
                />
              </div>

              <div className={styles.formField}>
                <label>Detalii (opțional)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className={styles.textarea} 
                  placeholder="Detalii adiționale..." 
                />
              </div>

              <div className={styles.formField}>
                <label>Importanță</label>
                <div className={styles.priorityGroup}>
                  <button type="button" className={styles.priorityBtn} data-active={importance === 'low'} onClick={() => setImportance('low')}>Mică</button>
                  <button type="button" className={styles.priorityBtn} data-active={importance === 'medium'} onClick={() => setImportance('medium')}>Medie</button>
                  <button type="button" className={styles.priorityBtn} data-active={importance === 'high'} onClick={() => setImportance('high')}>Mare</button>
                </div>
              </div>

              <div className={styles.formField}>
                <label>Adaugă o imagine (opțional)</label>
                <div className={styles.imageUpload}>
                  {isUploading ? (
                    <p>Se încarcă...</p>
                  ) : image ? (
                    <>
                      <img src={image} alt="Preview" className={styles.previewImage} />
                      <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
                    </>
                  ) : (
                    <>
                      <p>📷 Apasă pentru a încărca o poză</p>
                      <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
                    </>
                  )}
                </div>
                {image && !isUploading && (
                  <button type="button" onClick={() => setImage('')} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', marginTop: '5px' }}>
                    Șterge imaginea
                  </button>
                )}
              </div>

              <button type="submit" className={styles.saveBtn}>
                {editingId ? 'Salvează modificările' : 'Creează task'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
