import os from "os";

export function getSystemInfo() {
  return {
    device: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus()[0].model,
    cpuUsage: os.loadavg()[0] || 0,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
    timestamp: Date.now()
  };
}
