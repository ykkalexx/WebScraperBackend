import { Request, Response } from "express";

export class ScraperControllers {
    async scrapeWebsite(req: Request, res: Response) {
        try {
            const { url, item, selectors } = req.body;

            if (!url || !item || !selectors) {
                return res.status(400).json({ error: "The request is missing something"})
            }
        } catch (error: any) {
            console.error(error);
            res.status(500).json({error: error.message});
        }
    };
}