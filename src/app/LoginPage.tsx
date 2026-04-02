import { useState } from 'react';
import { api } from './api';

interface LoginPageProps {
  onLogin: (token: string, user: any) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo@pspay.ru');
  const [password, setPassword] = useState('demo123');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (tab === 'login') {
        data = await api.login(email, password);
      } else {
        data = await api.register(email, password, fullName);
      }
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <div style={{ background: '#4f6ef7', width: 48, height: 48, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>PS</div>
        </div>
        <h1>PS Pay</h1>
        <p>Сервис переводов с карты на карту</p>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Вход</button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Регистрация</button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label>Полное имя</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иван Иванов" />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Подождите...' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {tab === 'login' && (
          <p style={{ marginTop: '1rem', fontSize: '0.78rem', textAlign: 'center' }}>
            Демо: demo@pspay.ru / demo123
          </p>
        )}
      </div>
    </div>
  );
}
