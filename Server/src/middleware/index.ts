import rateLimit from "express-rate-limit";
import router from "../routes";

export const limiter = rateLimit({
  windowMs: 1000 * 60 * 15, // 15 mins
  max: 100, // limit each ip to 100 requests per 15 mins
});

router.use(limiter);
