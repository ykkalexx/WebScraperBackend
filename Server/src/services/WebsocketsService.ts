import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import logger from "../utils/logger";

class WebSocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on("subscribe", (jobId: string) => {
        socket.join(`job-${jobId}`);
        logger.info(`Client ${socket.id} subscribed to job ${jobId}`);
      });

      socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public notifyJobComplete(jobId: string, result: any) {
    this.io.to(`job-${jobId}`).emit("jobComplete", {
      jobId,
      status: "Completed",
      result,
    });
  }

  public notifyJobFailed(jobId: string, error: string) {
    this.io.to(`job-${jobId}`).emit("jobFailed", {
      jobId,
      status: "failed",
      error,
    });
  }
}

export default WebSocketService;
