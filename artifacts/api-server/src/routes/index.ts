import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contentRouter from "./content";
import searchRouter from "./search";
import agentRouter from "./agent";
import qaRouter from "./qa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contentRouter);
router.use("/search", searchRouter);
router.use("/agent", agentRouter);
router.use("/qa", qaRouter);

export default router;
