function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hrs = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}days ${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}


export function landingRoute(req, res) {
  const uptimeFormatted = formatUptime(process.uptime());

  const isOnline = process.uptime() > 0;
  const statusText = isOnline ? "ONLINE" : "OFFLINE";

  res.render("landing", {
    status: statusText,
    uptime: uptimeFormatted
  });
}
