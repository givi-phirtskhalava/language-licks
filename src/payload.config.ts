import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Admins } from "./collections/Admins";
import { Media } from "./collections/Media";
import { Lessons } from "./collections/Lessons";
import { TagGroups } from "./collections/TagGroups";
import {
  users,
  verificationCodes,
  progress,
  dailyActivity,
} from "./lib/db/schema";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ["@/views/LessonBoardNavLink#default"],
      views: {
        lessonBoard: {
          Component: "@/views/LessonBoard#default",
          path: "/lesson-board",
        },
      },
    },
  },
  collections: [Admins, Media, Lessons, TagGroups],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    beforeSchemaInit: [
      ({ schema }) => ({
        ...schema,
        tables: {
          ...schema.tables,
          users,
          verificationCodes,
          progress,
          dailyActivity,
        },
      }),
    ],
  }),
  sharp,
  plugins: [],
});
