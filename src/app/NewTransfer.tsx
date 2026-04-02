import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

interface Direction {
  id: number;
  code: string;
  name: string;
  currency_from: string;
  currency_to: string;
}

interface RatesData {
  rates: Record<string, number>;
  commissionRate: number;
  minCommission: number;
}

type Step = 'direction' | 'details' | 'calculate' | 'confirm' | 'done';

// === Input masks ===

function formatCardNumber(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatPhone(v: string): string {
  // Always starts with +7, Russian format: +7 (XXX) XXX-XX-XX
  let digits = v.replace(/\D/g, '');
  // If user typed 8 at start, replace with 7
  if (digits.startsWith('8') && digits.length > 1) digits = '7' + digits.slice(1);
  // Ensure starts with 7
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11); // max 11 digits for RU

  let result = '+7';
  const rest = digits.slice(1);
  if (rest.length > 0) result += ' (' + rest.slice(0, 3);
  if (rest.length >= 3) result += ')';
  if (rest.length > 3) result += ' ' + rest.slice(3, 6);
  if (rest.length > 6) result += '-' + rest.slice(6, 8);
  if (rest.length > 8) result += '-' + rest.slice(8, 10);
  return result;
}

function rawPhone(v: string): string {
  return '+' + v.replace(/\D/g, '');
}

export default function NewTransfer() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('direction');
  const [directions, setDirections] = useState<Direction[]>([]);
  const [selectedDir, setSelectedDir] = useState<Direction | null>(null);
  const [ratesData, setRatesData] = useState<RatesData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [senderCard, setSenderCard] = useState('4111 1111 1111 1111');
  const [senderName, setSenderName] = useState('');
  const [receiverCard, setReceiverCard] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('+7');
  const [amountSend, setAmountSend] = useState('10000');

  // Transfer state
  const [transfer, setTransfer] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<any>(null);

  useEffect(() => {
    api.getDirections().then(setDirections).catch(() => {});
    api.getRates().then(setRatesData).catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  // Client-side calculator
  const calcPreview = useMemo(() => {
    if (!ratesData || !selectedDir || !amountSend) return null;
    const amount = parseFloat(amountSend);
    if (!amount || amount <= 0) return null;

    const rate = ratesData.rates[selectedDir.currency_to];
    if (!rate) return null;

    const commission = Math.max(amount * ratesData.commissionRate, ratesData.minCommission);
    const amountReceive = Math.round(amount * rate * 100) / 100;
    const totalDebit = Math.round((amount + commission) * 100) / 100;

    return {
      rate,
      commission: Math.round(commission * 100) / 100,
      amountReceive,
      totalDebit,
    };
  }, [ratesData, selectedDir, amountSend]);

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
        receiverPhone: rawPhone(receiverPhone),
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Don't allow erasing the +7 prefix
    if (val.replace(/\D/g, '').length < 1) {
      setReceiverPhone('+7');
      return;
    }
    setReceiverPhone(formatPhone(val));
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
            <input
              value={senderCard}
              onChange={e => setSenderCard(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={19}
            />
          </div>
          <div className="form-group">
            <label>Имя отправителя</label>
            <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Иван Иванов" />
          </div>

          <h3 style={{ marginTop: '1rem' }}>Получатель</h3>
          <div className="form-group">
            <label>Номер карты / счёт получателя</label>
            <input
              value={receiverCard}
              onChange={e => setReceiverCard(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={19}
            />
          </div>
          <div className="form-group">
            <label>Имя получателя</label>
            <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Имя Фамилия" />
          </div>
          <div className="form-group">
            <label>Телефон получателя (РФ)</label>
            <input
              value={receiverPhone}
              onChange={handlePhoneChange}
              placeholder="+7 (900) 123-45-67"
              inputMode="tel"
              maxLength={18}
            />
          </div>

          <h3 style={{ marginTop: '1rem' }}>Сумма и расчёт</h3>
          <div className="form-group">
            <label>Сумма отправки ({selectedDir.currency_from})</label>
            <input
              type="number"
              value={amountSend}
              onChange={e => setAmountSend(e.target.value)}
              placeholder="10000"
              min="100"
            />
          </div>

          {/* Live calculator */}
          {calcPreview && (
            <div className="calc-result" style={{ marginBottom: '1rem' }}>
              <div className="calc-row">
                <span className="calc-row-label">Курс</span>
                <span className="calc-row-value">1 {selectedDir.currency_from} = {calcPreview.rate} {selectedDir.currency_to}</span>
              </div>
              <div className="calc-row">
                <span className="calc-row-label">Получатель получит</span>
                <span className="calc-row-value" style={{ color: '#2b6cb0', fontWeight: 700 }}>
                  {calcPreview.amountReceive.toLocaleString('ru-RU')} {selectedDir.currency_to}
                </span>
              </div>
              <div className="calc-row">
                <span className="calc-row-label">Комиссия (1.5%, мин. 50 {selectedDir.currency_from})</span>
                <span className="calc-row-value">{calcPreview.commission.toLocaleString('ru-RU')} {selectedDir.currency_from}</span>
              </div>
              <div className="calc-row calc-row-total">
                <span className="calc-row-label">Итого к списанию</span>
                <span className="calc-row-value">{calcPreview.totalDebit.toLocaleString('ru-RU')} {selectedDir.currency_from}</span>
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={createAndCalculate} disabled={loading || !amountSend || !senderCard || !receiverCard}>
            {loading ? 'Расчёт...' : 'Продолжить'}
          </button>
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep('direction')}>
            Назад
          </button>
        </div>
      )}

      {step === 'calculate' && transfer && (
        <div className="pspay-card">
          <h2>Подтверждение перевода</h2>

          <div style={{ background: '#f7fafc', borderRadius: 8, padding: '0.75rem', fontSize: '0.82rem', color: '#4a5568', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.4rem' }}>
              <strong>Отправитель:</strong> {transfer.senderName || '—'} &middot; {transfer.senderCard ? transfer.senderCard.replace(/(.{4})/g, '$1 ').trim() : '—'}
            </div>
            <div>
              <strong>Получатель:</strong> {transfer.receiverName || '—'} &middot; {transfer.receiverCard ? transfer.receiverCard.replace(/(.{4})/g, '$1 ').trim() : '—'}
            </div>
          </div>

          <div className="calc-result">
            <div className="calc-row">
              <span className="calc-row-label">Сумма отправки</span>
              <span className="calc-row-value">{transfer.amountSend?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Курс</span>
              <span className="calc-row-value">1 {transfer.currencyFrom} = {transfer.exchangeRate} {transfer.currencyTo}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Сумма получения</span>
              <span className="calc-row-value" style={{ color: '#2b6cb0', fontWeight: 700 }}>
                {transfer.amountReceive?.toLocaleString('ru-RU')} {transfer.currencyTo}
              </span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Комиссия</span>
              <span className="calc-row-value">{transfer.commission?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
            </div>
            <div className="calc-row calc-row-total">
              <span className="calc-row-label">Итого к списанию</span>
              <span className="calc-row-value">{transfer.totalDebit?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
            </div>
          </div>

          <button className="btn btn-primary" onClick={confirmTransfer} disabled={loading} style={{ marginTop: '0.75rem' }}>
            {loading ? 'Подтверждение...' : 'Подтвердить и отправить'}
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
              <span className="calc-row-value">{transfer.totalDebit?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
            </div>
            <div className="calc-row">
              <span className="calc-row-label">Получит</span>
              <span className="calc-row-value">{transfer.amountReceive?.toLocaleString('ru-RU')} {transfer.currencyTo}</span>
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
              setReceiverPhone('+7');
            }}>
              Новый перевод
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
