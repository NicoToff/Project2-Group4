import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router: Router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    res.render("index", { title: "TS Express" });
});

// router.post("/api/show", async (req: Request, res: Response) => {
//     // ...
// });

export default router;
