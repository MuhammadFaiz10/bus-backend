import { Hono } from "hono";
import { HonoEnv } from "../../types/app";
import {
  getAllTerminalsHandler,
  createTerminalHandler,
} from "./terminal.controller";

const terminalRouter = new Hono<HonoEnv>();

terminalRouter.get("/", getAllTerminalsHandler);
terminalRouter.post("/", createTerminalHandler);

export default terminalRouter;
