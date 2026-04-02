import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

interface Direction {
  id: number;
  code: string;
  name: string;
  currency_from: string;
  currency_to: string;
}

type Step = 'direction' | 'details' | 'calculate' | 'confirm' | 'done';

export default function NewTransfer() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('direction');
  const [directions, setDirections] = useState<Direction[]>([]);
  const [selectedDir, setSelectedDir] = useState<Direction | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [senderCard, setSenderCard] = useState('4111 1111 1111 1111');
  const [senderName, setSenderName] = useState('Иван Иванов');
  const [receiverCard, setReceiverCard] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [amountSend, setAmountSend] = useState('10000');

  // Transfer state
  const [transfer, setTransfer] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<any>(null);

  useEffect(() => {
    api.getDirections().then(setDirections).catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  const selectDirection = (dir: Direction) => {
    setSelectedDir(dir);
    setStep('details');
  };

  const createAndCalculate = async () => {
    if (!selectedDir) return;
    setError('');
    setLoading(true);
    try {
      const t = await api.createTransfer({
        directionId: selectedDir.id,
        senderCard: senderCard.replace(/\s/g, ''),
        senderName,
        receiverCard: receiverCard.replace(/\s/g, ''),
        receiverName,
        receiverPhone,
        amountSend: parseFloat(amountSend),
      });
      const calc = await api.calculateTransfer(t.id, parseFloat(amountSend));
      setTransfer(calc);
      setStep('calculate');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmTransfer = async () => {
    setError('');
    setLoading(true);
    try {
      const confirmed = await api.confirmTransfer(transfer.id);
      setTransfer(confirmed);
      setStep('done');

      // Poll for status change
      const interval = setInterval(async () => {
        try {
          const updated = await api.getTransfer(transfer.id);
          setTransfer(updated);
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
            clearInterval(interval);
          }
        } catch {}
      }, 2000);
      setPollInterval(interval);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem' }}>
        {(['direction', 'details', 'calculate', 'done'] as Step[]).map((s, i) => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: ['direction', 'details', 'calculate', 'confirm', 'done'].indexOf(step) >= i ? '#4f6ef7' : '#e2e8f0'
          }} />
        ))}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {step === 'direction' && (
        <div className="pspay-card">
          <h2>Выберите направление перевода</h2>
          <div className="direction-grid">
            {directions.map(dir => (
              <div key={dir.id} className="direction-card" onClick={() => selectDirection(dir)}>
                <div className="direction-card-name">{dir.name}</div>
                <div className="direction-card-pair">{dir.currency_from} &rarr; {dir.currency_to}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && selectedDir && (
        <div className="pspay-card">
          <h2>Реквизиты перевода</h2>
          <p style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '1rem' }}>
            {selectedDir.name} ({selectedDir.currency_from} &rarr; {selectedDir.currency_to})
          </p>

          <h3>Отправитель</h3>
          <div className="form-group">
            <label>Номер карты</label>
            <input value={senderCard} onChange={e => setSenderCard(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" />
          </div>
          <div className="form-group">
            <label>Имя отправителя</label>
            <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Иван Иванов" />
          </div>

          <h3 style={{ marginTop: '1rem' }}>Получатель</h3>
          <div className="form-group">
            <label>Номер карты / счёт получателя</label>
            <input value={receiverCard} onChange={e => setReceiverCard(e.target.value)} placeholder="8600 0000 0000 0000" />
          </div>
          <div className="form-group">
            <label>Имя получателя</label>
            <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Имя Фамилия" />
          </div>
          <div className="form-group">
            <label>Телефон получателя</label>
            <input value={receiverPhone} onChange={e => setReceiverPhone(e.target.value)} placeholder="+998 90 123 45 67" />
          </div>

          <h3 style={{ marginTop: '1rem' }}>Сумма</h3>
          <div className="form-group">
            <label>Сумма отправки ({selectedDir.currency_from})</label>
            <input type="number" value={amountSend} onChange={e => setAmountSend(e.target.value)} placeholder="10000" min="100" />
          </div>

          <button className="btn btn-primary" onClick={createAndCalculate} disabled={loading || !amountSend}>
            {loading ? 'Расчёт...' : 'Рассчитать перевод'}
          </button>
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep('direction')}>
            Назад
          </button>
        </div>
      )}

      {step === 'calculate' && transfer && (
        <div className="pspay-card">
          <h2>Параметры перевода</h2>
          <div className="calc-result">
            <div className="calc-row">
              <span className="calc-row-label">Сумма отправки</span>
              <span className="calc-row-value">{transfer.amountSend?.toLocaleString()} {transfer.currencyFrom}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Курс</span>
              <span className="calc-row-value">1 {transfer.currencyFrom} = {transfer.exchangeRate} {transfer.currencyTo}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Сумма получения</span>
              <span className="calc-row-value">{transfer.amountReceive?.toLocaleString()} {transfer.currencyTo}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Комиссия</span>
              <span className="calc-row-value">{transfer.commission?.toLocaleString()} {transfer.currencyFrom}</span>
            </div>
            <div className="calc-row calc-row-total">
              <span className="calc-row-label">Итого к списанию</span>
              <span className="calc-row-value">{transfer.totalDebit?.toLocaleString()} {transfer.currencyFrom}</span>
            </div>
          </div>

          <div style={{ background: '#f7fafc', borderRadius: 8, padding: '0.75rem', fontSize: '0.8rem', color: '#718096', marginBottom: '1rem' }}>
            <div>Карта отправителя: {transfer.senderCard}</div>
            <div>Получатель: {transfer.receiverName} ({transfer.receiverCard})</div>
          </div>

          <button className="btn btn-primary" onClick={confirmTransfer} disabled={loading}>
            {loading ? 'Подтверждение...' : 'Подтвердить перевод'}
          </button>
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep('details')}>
            Изменить
          </button>
        </div>
      )}

      {step === 'done' && transfer && (
        <div className="pspay-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            {transfer.status === 'COMPLETED' ? '\u2705' : transfer.status === 'FAILED' ? '\u274C' : '\u23F3'}
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>
            {transfer.status === 'COMPLETED' ? 'Перевод выполнен!' :
             transfer.status === 'FAILED' ? 'Ошибка перевода' : 'Обработка...'}
          </h2>
          <span className={`status-badge status-${transfer.status}`}>{transfer.status}</span>

          <div className="calc-result" style={{ marginTop: '1rem', textAlign: 'left' }}>
            <div className="calc-row">
              <span className="calc-row-label">Отправлено</span>
              <span className="calc-row-value">{transfer.totalDebit?.toLocaleString()} {transfer.currencyFrom}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Получит</span>
              <span className="calc-row-value">{transfer.amountReceive?.toLocaleString()} {transfer.currencyTo}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Получатель</span>
              <span className="calc-row-value">{transfer.receiverName}</span>
            </div>
          </div>

          {transfer.errorMessage && (
            <div className="error-msg" style={{ marginTop: '0.75rem' }}>{transfer.errorMessage}</div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/avo-po/app')}>
              К истории
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
              setStep('direction');
              setTransfer(null);
              setReceiverCard('');
              setReceiverName('');
              setReceiverPhone('');
            }}>
              Новый перевод
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
