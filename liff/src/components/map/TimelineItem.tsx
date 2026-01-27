import type { TimelineActivity } from '../../types';

interface TimelineItemProps {
  activity: TimelineActivity;
  onClick?: () => void;
}

export const TimelineItem = ({ activity, onClick }: TimelineItemProps) => {
  return (
    <div
      className={`activity-item ${activity.isLatest ? 'latest' : ''}`}
      data-gateway-id={activity.gatewayId}
      onClick={onClick}
    >
      <div className={`timeline-dot ${activity.isLatest ? 'latest-dot' : ''}`} />
      <div className={`activity-card ${activity.isLatest ? 'latest-card' : ''}`}>
        <div className="activity-header">
          <div className="activity-title">{activity.gatewayName}</div>
          <div className="activity-time">{activity.time}</div>
        </div>
        <div className="activity-message">
          <span>{activity.message}</span>
          {activity.hasNotification && (
            <svg className="notification-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

interface DateGroupProps {
  date: string;
  children: React.ReactNode;
}

export const DateGroup = ({ date, children }: DateGroupProps) => {
  return (
    <div className="date-group">
      <div className="date-title">{date}</div>
      {children}
    </div>
  );
};
