import { Hono } from "hono";
import { getAllTerminalsHandler, createTerminalHandler, } from "./terminal.controller";
const terminalRouter = new Hono();
terminalRouter.get("/", getAllTerminalsHandler);
terminalRouter.post("/", createTerminalHandler);
export default terminalRouter;
