import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contentRouter from "./content";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contentRouter);
router.use("/search", searchRouter);

export default router;
