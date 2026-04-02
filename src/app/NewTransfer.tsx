import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from './api';

interface Direction {
  id: number;
  code: string;
  name: string;
  country_from: string;
  country_to: string;
  currency_from: string;
  currency_to: string;
}

interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
}

interface RatesData {
  rates: Record<string, number>;
  commissionRate: number;
  minCommission: number;
}

type Step = 'amount' | 'sender' | 'receiver' | 'review' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'amount', label: 'Сумма' },
  { key: 'sender', label: 'Отправитель' },
  { key: 'receiver', label: 'Получатель' },
  { key: 'review', label: 'Подтверждение' },
];

function formatCardNumber(v: string): string {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatPhone(v: string): string {
  let digits = v.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length > 1) digits = '7' + digits.slice(1);
  if (!digits.startsWith('7')) digits = '7' + digits;
  digits = digits.slice(0, 11);
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

function maskCard(card: string | null): string {
  if (!card) return '—';
  const clean = card.replace(/\s/g, '');
  return '**** ' + clean.slice(-4);
}

function Stepper({ step }: { step: Step }) {
  const currentIdx = STEPS.findIndex(s => s.key === step);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s.key} className={`stepper-item ${i < currentIdx ? 'stepper-item--completed' : i === currentIdx ? 'stepper-item--active' : ''}`}>
          <div className="stepper-circle">
            {i < currentIdx ? '\u2713' : i + 1}
          </div>
          <div className="stepper-label">{s.label}</div>
          {i < STEPS.length - 1 && <div className="stepper-line" />}
        </div>
      ))}
    </div>
  );
}

export default function NewTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('amount');
  const [directions, setDirections] = useState<Direction[]>([]);
  const [countries, setCountries] = useState<Record<string, Country>>({});
  const [selectedDir, setSelectedDir] = useState<Direction | null>(null);
  const [ratesData, setRatesData] = useState<RatesData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  const [senderCard, setSenderCard] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiverCard, setReceiverCard] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('+7');
  const [amountSend, setAmountSend] = useState('10000');

  const [transfer, setTransfer] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<any>(null);

  // Load directions, countries, rates
  useEffect(() => {
    api.getDirections().then(setDirections).catch(() => {});
    api.getRates().then(setRatesData).catch(() => {});
    api.getCountries().then((list: Country[]) => {
      const map: Record<string, Country> = {};
      list.forEach(c => { map[c.code] = c; });
      setCountries(map);
    }).catch(() => {});
  }, []);

  // Prefill from URL params (repeat transfer)
  useEffect(() => {
    if (prefilled || directions.length === 0) return;
    const dirId = searchParams.get('directionId');
    const amt = searchParams.get('amount');
    const sc = searchParams.get('senderCard');
    const sn = searchParams.get('senderName');
    const rc = searchParams.get('receiverCard');
    const rn = searchParams.get('receiverName');
    const rp = searchParams.get('receiverPhone');

    if (dirId) {
      const dir = directions.find(d => d.id === parseInt(dirId));
      if (dir) setSelectedDir(dir);
    }
    if (amt) setAmountSend(amt);
    if (sc) setSenderCard(formatCardNumber(sc));
    if (sn) setSenderName(sn);
    if (rc) setReceiverCard(formatCardNumber(rc));
    if (rn) setReceiverName(rn);
    if (rp && rp.length > 2) setReceiverPhone(formatPhone(rp));
    setPrefilled(true);
  }, [directions, searchParams, prefilled]);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  const calcPreview = useMemo(() => {
    if (!ratesData || !selectedDir || !amountSend) return null;
    const amount = parseFloat(amountSend);
    if (!amount || amount <= 0) return null;
    const rate = ratesData.rates[selectedDir.currency_to];
    if (!rate) return null;
    const commission = Math.max(amount * ratesData.commissionRate, ratesData.minCommission);
    const amountReceive = Math.round(amount * rate * 100) / 100;
    const totalDebit = Math.round((amount + commission) * 100) / 100;
    return { rate, commission: Math.round(commission * 100) / 100, amountReceive, totalDebit };
  }, [ratesData, selectedDir, amountSend]);

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
      setStep('review');
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
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED') clearInterval(interval);
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
    if (e.target.value.replace(/\D/g, '').length < 1) { setReceiverPhone('+7'); return; }
    setReceiverPhone(formatPhone(e.target.value));
  };

  // Get country name for a direction
  const getCountryLabel = (dir: Direction) => {
    const c = countries[dir.country_to];
    return c ? `${c.flag} ${c.name}` : dir.name;
  };

  return (
    <div>
      {step !== 'done' && <Stepper step={step} />}
      {error && <div className="error-msg">{error}</div>}

      {/* === Step 1: Amount + Direction === */}
      {step === 'amount' && (
        <div className="step-content">
          <div className="pspay-card">
            <h2>Куда отправить перевод?</h2>
            <div className="direction-chips">
              {directions.map(dir => (
                <button
                  key={dir.id}
                  className={`direction-chip ${selectedDir?.id === dir.id ? 'direction-chip--selected' : ''}`}
                  onClick={() => setSelectedDir(dir)}
                >
                  {countries[dir.country_to]?.flag || ''} {countries[dir.country_to]?.name || dir.currency_to}
                </button>
              ))}
            </div>
          </div>

          {selectedDir && (
            <>
              <div className="amount-hero">
                <div className="amount-row">
                  <span className="amount-row-label">Вы отправляете</span>
                  <input
                    className="amount-row-input"
                    type="number"
                    value={amountSend}
                    onChange={e => setAmountSend(e.target.value)}
                    placeholder="0"
                    min="100"
                  />
                  <span className="amount-row-currency">{selectedDir.currency_from}</span>
                </div>

                {calcPreview && (
                  <>
                    <div className="amount-divider">
                      <span>Курс:</span>
                      <span className="amount-divider-rate">1 {selectedDir.currency_from} = {calcPreview.rate} {selectedDir.currency_to}</span>
                    </div>
                    <div className="amount-receive">
                      <span className="amount-row-label">Получит в {countries[selectedDir.country_to]?.name || selectedDir.currency_to}</span>
                      <span className="amount-receive-value">{calcPreview.amountReceive.toLocaleString('ru-RU')}</span>
                      <span className="amount-row-currency">{selectedDir.currency_to}</span>
                    </div>
                    <div className="amount-fee-line">
                      <span>Комиссия (1.5%, мин. 50 {selectedDir.currency_from})</span>
                      <span className="amount-fee-value">{calcPreview.commission.toLocaleString('ru-RU')} {selectedDir.currency_from}</span>
                    </div>
                    <div className="amount-fee-line">
                      <span>Итого к списанию</span>
                      <span className="amount-fee-value">{calcPreview.totalDebit.toLocaleString('ru-RU')} {selectedDir.currency_from}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ fontSize: '0.72rem', color: '#a0aec0', textAlign: 'center', margin: '0.5rem 0' }}>
                Комиссия за перевод: 1.5% от суммы (минимум 50 {selectedDir.currency_from})
              </div>
            </>
          )}

          <button
            className="btn btn-primary"
            disabled={!selectedDir || !amountSend || parseFloat(amountSend) <= 0}
            onClick={() => setStep('sender')}
          >
            Продолжить
          </button>
        </div>
      )}

      {/* === Step 2: Sender === */}
      {step === 'sender' && selectedDir && (
        <div className="step-content">
          <div className="summary-bar">
            <span className="summary-bar-direction">{getCountryLabel(selectedDir)}</span>
            <span className="summary-bar-amount">{parseFloat(amountSend).toLocaleString('ru-RU')} {selectedDir.currency_from}</span>
          </div>

          <div className="pspay-card">
            <h2>Данные отправителя</h2>
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
              <label>Имя на карте</label>
              <input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="IVAN IVANOV" />
            </div>
          </div>

          <button className="btn btn-primary" disabled={!senderCard || senderCard.replace(/\s/g, '').length < 16} onClick={() => setStep('receiver')}>
            Продолжить
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep('amount')}>
            &larr; Назад
          </button>
        </div>
      )}

      {/* === Step 3: Receiver === */}
      {step === 'receiver' && selectedDir && (
        <div className="step-content">
          <div className="summary-bar">
            <span className="summary-bar-direction">{getCountryLabel(selectedDir)}</span>
            <span className="summary-bar-amount">{parseFloat(amountSend).toLocaleString('ru-RU')} {selectedDir.currency_from}</span>
          </div>

          <div className="pspay-card">
            <h2>Данные получателя</h2>
            <div className="form-group">
              <label>Номер карты / счёт</label>
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
              <label>Телефон (РФ)</label>
              <input value={receiverPhone} onChange={handlePhoneChange} placeholder="+7 (900) 123-45-67" inputMode="tel" maxLength={18} />
            </div>
          </div>

          <button
            className="btn btn-primary"
            disabled={loading || !receiverCard || receiverCard.replace(/\s/g, '').length < 13}
            onClick={createAndCalculate}
          >
            {loading ? 'Расчёт...' : 'Продолжить'}
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep('sender')}>
            &larr; Назад
          </button>
        </div>
      )}

      {/* === Step 4: Review (receipt) === */}
      {step === 'review' && transfer && selectedDir && (
        <div className="step-content">
          <div className="pspay-card">
            <div className="review-hero">
              <div className="review-hero-amount">{transfer.amountSend?.toLocaleString('ru-RU')} {transfer.currencyFrom}</div>
              <div className="review-hero-arrow">&darr;</div>
              <div className="review-hero-receive">{transfer.amountReceive?.toLocaleString('ru-RU')} {transfer.currencyTo}</div>
              <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: '0.25rem' }}>
                {getCountryLabel(selectedDir)}
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-title">Отправитель</div>
              <div className="review-row">
                <span className="review-row-label">Карта</span>
                <span className="review-row-value">{maskCard(transfer.senderCard)}</span>
              </div>
              <div className="review-row">
                <span className="review-row-label">Имя</span>
                <span className="review-row-value">{transfer.senderName || '—'}</span>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-title">Получатель</div>
              <div className="review-row">
                <span className="review-row-label">Карта / счёт</span>
                <span className="review-row-value">{maskCard(transfer.receiverCard)}</span>
              </div>
              <div className="review-row">
                <span className="review-row-label">Имя</span>
                <span className="review-row-value">{transfer.receiverName || '—'}</span>
              </div>
            </div>

            <div className="review-section">
              <div className="review-section-title">Детали перевода</div>
              <div className="review-row">
                <span className="review-row-label">Курс</span>
                <span className="review-row-value">1 {transfer.currencyFrom} = {transfer.exchangeRate} {transfer.currencyTo}</span>
              </div>
              <div className="review-row">
                <span className="review-row-label">Комиссия (1.5%)</span>
                <span className="review-row-value">{transfer.commission?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
              </div>
              <div className="review-row" style={{ fontWeight: 600 }}>
                <span className="review-row-label" style={{ color: '#1a202c' }}>Итого к списанию</span>
                <span className="review-row-value">{transfer.totalDebit?.toLocaleString('ru-RU')} {transfer.currencyFrom}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={confirmTransfer} disabled={loading} style={{ background: '#48bb78' }}>
            {loading ? 'Отправка...' : 'Подтвердить и отправить'}
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setStep('amount')}>
            Изменить
          </button>
        </div>
      )}

      {/* === Step 5: Done === */}
      {step === 'done' && transfer && (
        <div className="step-content">
          <div className="pspay-card" style={{ textAlign: 'center' }}>
            <div className={`done-icon ${transfer.status === 'COMPLETED' ? 'done-icon--success' : transfer.status === 'FAILED' ? 'done-icon--failed' : 'done-icon--processing'}`}>
              {transfer.status === 'COMPLETED' ? '\u2713' : transfer.status === 'FAILED' ? '\u2717' : '\u21BB'}
            </div>
            <h2 style={{ marginBottom: '0.25rem' }}>
              {transfer.status === 'COMPLETED' ? 'Перевод выполнен!' :
               transfer.status === 'FAILED' ? 'Ошибка перевода' : 'Обработка перевода...'}
            </h2>
            <span className={`status-badge status-${transfer.status}`}>{transfer.status}</span>

            <div style={{ marginTop: '1.25rem', fontSize: '1.3rem', fontWeight: 700 }}>
              {transfer.amountSend?.toLocaleString('ru-RU')} {transfer.currencyFrom}
            </div>
            <div style={{ color: '#2b6cb0', fontWeight: 600, fontSize: '0.95rem', marginTop: '0.15rem' }}>
              &rarr; {transfer.amountReceive?.toLocaleString('ru-RU')} {transfer.currencyTo}
            </div>
            <div style={{ color: '#718096', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              {transfer.receiverName}
            </div>

            <div className="timeline" style={{ textAlign: 'left', marginTop: '1.25rem' }}>
              <div className="timeline-item timeline-item--completed">
                <div className="timeline-dot" />
                <div className="timeline-label">Перевод создан</div>
              </div>
              <div className={`timeline-item ${transfer.status === 'PROCESSING' ? 'timeline-item--active' : transfer.status === 'COMPLETED' || transfer.status === 'FAILED' ? 'timeline-item--completed' : 'timeline-item--pending'}`}>
                <div className="timeline-dot" />
                <div className="timeline-label">Обработка партнёром</div>
              </div>
              <div className={`timeline-item ${transfer.status === 'COMPLETED' ? 'timeline-item--completed' : transfer.status === 'FAILED' ? 'timeline-item--failed' : 'timeline-item--pending'}`}>
                <div className="timeline-dot" />
                <div className="timeline-label">{transfer.status === 'FAILED' ? 'Ошибка' : 'Завершён'}</div>
              </div>
            </div>

            {transfer.errorMessage && (
              <div className="error-msg" style={{ marginTop: '0.75rem' }}>{transfer.errorMessage}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/avo-po/app')}>
              К переводам
            </button>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
              setStep('amount'); setTransfer(null); setReceiverCard(''); setReceiverName(''); setReceiverPhone('+7');
            }}>
              Новый перевод
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
