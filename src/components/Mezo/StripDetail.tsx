import { useReducedMotion } from 'framer-motion';
import type { LoanDetail, MezoAction } from '../../data/mezoActions';
import { ACTION_LABELS, formatAmount } from '../../data/mezoActions';
import { GiftIcon } from './icons';
import { MotionDiv } from './motion';
import { EXPANDED_H, TIMING, expandedWidthFor } from './constants';

const STATE_TEXT: Record<string, string> = {
  complete: 'complete',
  pending: 'pending',
  upcoming: 'upcoming',
};

function useDetailVariants() {
  const reduceMotion = useReducedMotion();
  const item = (enterDelay: number) => ({
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: TIMING.rise },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0.15 }
        : { delay: enterDelay, duration: 0.25, ease: TIMING.easeOut },
    },
    exit: reduceMotion
      ? { opacity: 0, transition: { duration: 0.1 } }
      : {
          opacity: 0,
          y: TIMING.exitSink,
          transition: { duration: TIMING.exitContent, ease: TIMING.easeOut },
        },
  });

  return { item, reduceMotion };
}

const Schedule = ({ detail, baseDelay }: { detail: LoanDetail; baseDelay: number }) => {
  const reduceMotion = useReducedMotion();
  return (
    <div className="mezo-schedule">
      <div className="mezo-schedule-items">
        {detail.schedule.map((entry, i) => (
          <MotionDiv
            key={entry.date}
            className={`mezo-schedule-item is-${entry.state}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                delay: baseDelay + i * TIMING.innerStagger,
                duration: 0.2,
                ease: TIMING.easeOut,
              },
            }}
          >
            <div className="mezo-schedule-rail">
              <div className={`mezo-schedule-marker is-${entry.state}`} />
              {i < detail.schedule.length - 1 && <div className="mezo-schedule-line" />}
            </div>
            <div className={`mezo-schedule-text${entry.state === 'upcoming' ? ' is-faded' : ''}`}>
              {entry.date} {STATE_TEXT[entry.state]}
              <span className="mezo-schedule-amount">{formatAmount(entry.amount)}</span>
            </div>
          </MotionDiv>
        ))}
      </div>
    </div>
  );
};

const StatusRows = ({
  action,
  detail,
  baseDelay,
}: {
  action: MezoAction;
  detail?: LoanDetail;
  baseDelay: number;
}) => {
  const reduceMotion = useReducedMotion();
  const rows = detail
    ? [
        { key: 'Status', value: action.status, pill: true },
        { key: 'Interest saved', value: formatAmount(detail.interestSaved) },
        { key: 'Payed from', value: detail.payedFrom, link: true },
        { key: 'Payment date', value: detail.paymentDate },
      ]
    : [
        { key: 'Amount', value: formatAmount(action.amount) },
        { key: 'Account', value: 'linked account', link: true },
        { key: 'Date', value: action.dateLabel },
      ];

  return (
    <div className="mezo-status-rows">
      {rows.map((row, i) => (
        <MotionDiv
          key={row.key}
          className="mezo-status-row"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: baseDelay + i * TIMING.innerStagger,
              duration: 0.2,
              ease: TIMING.easeOut,
            },
          }}
        >
          <span className="mezo-status-key">{row.key}</span>
          {row.pill ? (
            <span className={`mezo-pill ${action.status === 'active' ? 'is-green-solid' : ''}`}>
              {row.value}
            </span>
          ) : row.link ? (
            <span className="mezo-status-value is-link">{row.value}</span>
          ) : (
            <span className="mezo-status-value">{row.value}</span>
          )}
        </MotionDiv>
      ))}
    </div>
  );
};

const LoanHealth = ({ detail, baseDelay }: { detail: LoanDetail; baseDelay: number }) => {
  const reduceMotion = useReducedMotion();
  return (
    <MotionDiv
      className="mezo-health"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: baseDelay, duration: 0.2, ease: TIMING.easeOut },
      }}
    >
      <div className="mezo-health-header">
        <span className="mezo-health-title">
          Loan health
          <span className="mezo-health-info">i</span>
        </span>
        <span className="mezo-health-ratio">{detail.loanHealth}</span>
      </div>
      <div className="mezo-health-bar">
        <div
          className="mezo-health-marker"
          style={{ left: `${detail.loanHealthPosition * 100}%` }}
        />
      </div>
    </MotionDiv>
  );
};

export const StripDetail = ({ action }: { action: MezoAction }) => {
  const { item, reduceMotion } = useDetailVariants();
  const detail = action.loanDetail;
  const isLoan = action.type === 'loan';
  const innerBase = TIMING.enterPane + 0.1;
  const cardW = expandedWidthFor(action.type);

  return (
    <MotionDiv
      className={`mezo-detail${isLoan ? '' : ' is-simple'}`}
      style={{ width: cardW, height: EXPANDED_H }}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={{
        hidden: {},
        visible: {},
        exit: {
          transition: {
            staggerChildren: TIMING.exitStagger,
            staggerDirection: -1,
          },
        },
      }}
    >
      {/* DOM order: tile, pane, buttons — staggerDirection -1 exits buttons → pane → tile */}
      <MotionDiv
        className="mezo-detail-tile"
        variants={{
          hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: reduceMotion
              ? { duration: 0.15 }
              : { delay: TIMING.enterTile, ...TIMING.tileSpring },
          },
          exit: reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.9, transition: { duration: TIMING.exitContent, ease: TIMING.easeOut } },
        }}
      >
        {isLoan && <GiftIcon />}
        {isLoan && <div className="mezo-detail-tile-badge" />}
      </MotionDiv>

      <MotionDiv className="mezo-detail-right" variants={item(TIMING.enterPane)}>
        {detail ? (
          <>
            <div className="mezo-progress-header">
              <span className="mezo-progress-title">Progress</span>
              <div className="mezo-progress-pills">
                <span className="mezo-pill is-green-solid">{detail.progressPct}%</span>
                <span className="mezo-pill is-green">{detail.progressLabel}</span>
              </div>
            </div>
            <div className="mezo-detail-columns is-loan">
              <Schedule detail={detail} baseDelay={innerBase} />
              <div>
                <StatusRows action={action} detail={detail} baseDelay={innerBase} />
                <LoanHealth detail={detail} baseDelay={innerBase + 4 * TIMING.innerStagger} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mezo-progress-header">
              <span className="mezo-progress-title">Details</span>
              <div className="mezo-progress-pills">
                <span className={`mezo-pill ${action.status === 'active' ? 'is-green' : ''}`}>
                  {action.status === 'active' ? 'in progress' : 'settled'}
                </span>
              </div>
            </div>
            <div className="mezo-detail-columns" style={{ gridTemplateColumns: '1fr' }}>
              <StatusRows action={action} baseDelay={innerBase} />
            </div>
          </>
        )}
      </MotionDiv>

      <MotionDiv className="mezo-detail-actions" variants={item(TIMING.enterButtons)}>
        {isLoan ? (
          <>
            <button type="button" className="mezo-detail-btn">
              Borrow more
            </button>
            <button type="button" className="mezo-detail-btn">
              Pay back early
            </button>
          </>
        ) : (
          <button type="button" className="mezo-detail-btn">
            Repeat {ACTION_LABELS[action.type].toLowerCase()}
          </button>
        )}
      </MotionDiv>
    </MotionDiv>
  );
};
