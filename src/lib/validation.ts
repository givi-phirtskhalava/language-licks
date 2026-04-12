import { z } from "zod";
import { LANGUAGES } from "./projectConfig";

const languageIds = LANGUAGES.map((l) => l.id) as [string, ...string[]];

export const languageIdSchema = z.enum(languageIds);
