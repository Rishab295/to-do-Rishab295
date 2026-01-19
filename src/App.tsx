import React from 'react';
import './App.css';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: 'high' | 'medium' | 'low';
  dueAt?: number | null;
};

const STORAGE_KEY = 'todo-react-cra.todos.v1';
const THEME_STORAGE_KEY = 'todo-react-cra.theme.v1';
type Theme = 'light' | 'dark';

function App() {
  const [text, setText] = React.useState('');
  const [priority, setPriority] = React.useState<'high' | 'medium' | 'low'>('medium');
  const [due, setDue] = React.useState<string>('');
  const [theme, setTheme] = React.useState<Theme>(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });
  const [todos, setTodos] = React.useState<Todo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((t: any): Todo => ({
        id: t.id,
        text: t.text,
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
        priority: t.priority === 'high' || t.priority === 'low' ? t.priority : 'medium',
        dueAt: typeof t.dueAt === 'number' ? t.dueAt : null,
      }));
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // ignore storage quota / private mode errors
    }
  }, [todos]);

  const remaining = React.useMemo(
    () => todos.reduce((acc, t) => acc + (t.completed ? 0 : 1), 0),
    [todos]
  );

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const next: Todo = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      priority,
      dueAt: due ? new Date(due).getTime() : null,
    };
    setTodos((prev) => [next, ...prev]);
    setText('');
    setDue('');
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const setLightTheme = () => setTheme('light');
  const setDarkTheme = () => setTheme('dark');

  const formatDue = (timestamp: number | null | undefined) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="App">
      <div className="todoShell">
        <header className="todoHeader">
          <div className="todoHeaderMain">
            <div className="todoTitleRow">
              <h1 className="todoTitle">Tasks</h1>
              <span className="todoBadge">Today</span>
            </div>
            <p className="todoSub">
              {todos.length === 0
                ? 'Add your first task to stay on top of your day.'
                : `${remaining} remaining • ${todos.length} total`}
            </p>
          </div>
          <div className="todoHeaderRight">
            <div className="pillStats">
              <strong>{remaining}</strong> open · {todos.length - remaining} done
            </div>
            <div className="segmentedSwitch" aria-label="Theme toggle" role="radiogroup">
              <button
                type="button"
                className={theme === 'light' ? 'isActive' : undefined}
                onClick={setLightTheme}
                role="radio"
                aria-checked={theme === 'light'}
              >
                <span className="icon">☀️</span> Light
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'isActive' : undefined}
                onClick={setDarkTheme}
                role="radio"
                aria-checked={theme === 'dark'}
              >
                <span className="icon">🌙</span> Dark
              </button>
            </div>
            <button
              className="btn btnGhost"
              type="button"
              onClick={clearCompleted}
              disabled={todos.every((t) => !t.completed)}
              title="Remove completed tasks"
            >
              Clear completed
            </button>
          </div>
        </header>

        <form className="todoForm" onSubmit={addTodo}>
          <div className="todoFormMain">
          <input
            className="todoInput"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you need to do?"
            aria-label="New to-do"
            autoFocus
          />
          </div>
          <div className="todoFormMeta">
            <select
              className="todoSelect"
              aria-label="Priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as 'high' | 'medium' | 'low')
              }
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              className="todoDateTime"
              type="datetime-local"
              aria-label="Due date and time"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <button className="btn btnPrimary" type="submit" disabled={!text.trim()}>
            Add
          </button>
        </form>

        <ul className="todoList" aria-label="To-dos">
          {todos.map((t) => (
            <li key={t.id} className="todoRow">
              <div className="todoRowMain">
              <label className="todoItem">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => toggleTodo(t.id)}
                  aria-label={t.completed ? 'Mark as not completed' : 'Mark as completed'}
                />
                <span className={t.completed ? 'todoText todoTextDone' : 'todoText'}>
                  {t.text}
                </span>
              </label>
                <div className="todoMetaRow">
                  <span className={`priorityChip priority-${t.priority}`}>
                    {t.priority === 'high'
                      ? 'High priority'
                      : t.priority === 'low'
                      ? 'Low priority'
                      : 'Medium priority'}
                  </span>
                  {formatDue(t.dueAt ?? null) ? (
                    <span className="todoDue">Due {formatDue(t.dueAt ?? null)}</span>
                  ) : null}
                </div>
              </div>
              <button
                className="btn btnDanger"
                type="button"
                onClick={() => deleteTodo(t.id)}
                aria-label={`Delete ${t.text}`}
                title="Delete"
              >
                Delete
              </button>
            </li>
          ))}
          {todos.length === 0 ? (
            <li className="todoEmpty">No tasks yet.</li>
          ) : null}
        </ul>
        <footer className="todoFooter" aria-label="Signature">
          Made by Rishab
        </footer>
      </div>
    </div>
  );
}

export default App;
