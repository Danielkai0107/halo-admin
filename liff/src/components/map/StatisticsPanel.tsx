import { DeviceActivity } from "../../services/activityService";
import {
  calculateHourlyActivity,
  calculateDailyActivity,
  calculateHotspots,
  getPeakActivityTime,
  getMostVisitedGateway,
  getAverageActivitiesPerDay,
} from "../../utils/statisticsHelper";

interface StatisticsPanelProps {
  activities: DeviceActivity[];
}

export const StatisticsPanel = ({ activities }: StatisticsPanelProps) => {
  const hourlyData = calculateHourlyActivity(activities);
  const dailyData = calculateDailyActivity(activities);
  const hotspots = calculateHotspots(activities, 5);

  const maxHourlyCount = Math.max(...hourlyData.map((d) => d.count), 1);
  const maxDailyCount = Math.max(...dailyData.map((d) => d.count), 1);

  const peakTime = getPeakActivityTime(activities);
  const mostVisited = getMostVisitedGateway(activities);
  const avgPerDay = getAverageActivitiesPerDay(activities);

  return (
    <div style={{ padding: "0 0 40px 0" }}>
      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          padding: "0 16px",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}
          >
            高峰時段
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: "bold", color: "#4ECDC4" }}
          >
            {peakTime}
          </div>
        </div>
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}
          >
            日均活動
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: "bold", color: "#4ECDC4" }}
          >
            {avgPerDay}
          </div>
        </div>
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: "12px",
            padding: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}
          >
            最常去
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#4ECDC4",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {mostVisited}
          </div>
        </div>
      </div>

      {/* Hourly Activity Chart */}
      <div style={{ padding: "0 16px", marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#2c3e50",
            marginBottom: "12px",
          }}
        >
          24小時活動分布
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            height: "100px",
            gap: "2px",
          }}
        >
          {hourlyData.map((data) => {
            const heightPercentage = (data.count / maxHourlyCount) * 100;
            return (
              <div
                key={data.hour}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${heightPercentage}%`,
                    background:
                      data.count > 0
                        ? "linear-gradient(180deg, #4ECDC4 0%, #44B8B2 100%)"
                        : "#e0e0e0",
                    borderRadius: "4px 4px 0 0",
                    minHeight: data.count > 0 ? "4px" : "2px",
                  }}
                />
                {data.hour % 3 === 0 && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#999",
                      marginTop: "4px",
                    }}
                  >
                    {data.hour}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div style={{ padding: "0 16px", marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#2c3e50",
            marginBottom: "12px",
          }}
        >
          近7天活動趨勢
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            height: "100px",
            gap: "8px",
          }}
        >
          {dailyData.map((data, index) => {
            const heightPercentage = (data.count / maxDailyCount) * 100;
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#4ECDC4",
                    marginBottom: "4px",
                    fontWeight: "bold",
                  }}
                >
                  {data.count > 0 ? data.count : ""}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: `${heightPercentage}%`,
                    background:
                      data.count > 0
                        ? "linear-gradient(180deg, #4ECDC4 0%, #3BB5B3 100%)"
                        : "#e0e0e0",
                    borderRadius: "8px 8px 0 0",
                    minHeight: data.count > 0 ? "8px" : "4px",
                  }}
                />
                <div
                  style={{
                    fontSize: "10px",
                    color: "#999",
                    marginTop: "4px",
                  }}
                >
                  {data.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hotspots */}
      <div style={{ padding: "0 16px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#2c3e50",
            marginBottom: "24px",
          }}
        >
          熱門地點 TOP 5
        </div>
        {hotspots.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#999",
              fontSize: "14px",
            }}
          >
            暫無數據
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {hotspots.map((hotspot, index) => (
              <div
                key={hotspot.gatewayId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background:
                      index === 0
                        ? "#FFD700"
                        : index === 1
                          ? "#C0C0C0"
                          : index === 2
                            ? "#CD7F32"
                            : "#4ECDC4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#2c3e50",
                      fontWeight: "500",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hotspot.gatewayName}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: "6px",
                        background: "#e0e0e0",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${hotspot.percentage}%`,
                          height: "100%",
                          background: "#4ECDC4",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        minWidth: "50px",
                        textAlign: "right",
                      }}
                    >
                      {hotspot.count} 次
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
