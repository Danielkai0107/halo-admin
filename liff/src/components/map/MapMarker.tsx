import type { GatewayType, Elder } from '../../types';

interface MapMarkerProps {
  type: 'gateway' | 'activity';
  position: {
    top: string;
    left: string;
  };
  gatewayType?: GatewayType;
  elder?: Elder;
  onClick?: () => void;
}

export const MapMarker = ({ type, position, gatewayType, elder, onClick }: MapMarkerProps) => {
  if (type === 'gateway' && gatewayType) {
    return (
      <div
        className={`map-marker marker-gateway`}
        data-type={gatewayType.toLowerCase().replace('_', '-')}
        style={{ top: position.top, left: position.left }}
        onClick={onClick}
      >
        <div className="marker-icon">
          {gatewayType === 'SAFE_ZONE' && (
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          )}
          {gatewayType === 'SCHOOL_ZONE' && (
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9M12 5.09L16.5 7.5 12 9.91 7.5 7.5 12 5.09z"/>
            </svg>
          )}
          {gatewayType === 'OBSERVE_ZONE' && (
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
          )}
          {gatewayType === 'INACTIVE' && (
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          )}
        </div>
      </div>
    );
  }

  if (type === 'activity' && elder) {
    return (
      <div
        className="map-marker marker-activity"
        style={{ top: position.top, left: position.left }}
        onClick={onClick}
      >
        <div className="marker-icon activity-marker">
          {elder.photo ? (
            <img
              src={elder.photo}
              alt={elder.name}
              className="activity-avatar"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="white">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  `;
                }
              }}
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          )}
        </div>
      </div>
    );
  }

  return null;
};
