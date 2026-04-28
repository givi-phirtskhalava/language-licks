import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { gcsStorage } from "@payloadcms/storage-gcs";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Admins } from "./collections/Admins";
import { AudioFiles } from "./collections/AudioFiles";
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

const { PAYLOAD_SECRET, DATABASE_URL, RESEND_API_KEY, EMAIL_FROM } =
  process.env;
if (!PAYLOAD_SECRET) throw new Error("Missing required env: PAYLOAD_SECRET");
if (!DATABASE_URL) throw new Error("Missing required env: DATABASE_URL");
if (!RESEND_API_KEY) throw new Error("Missing required env: RESEND_API_KEY");
if (!EMAIL_FROM) throw new Error("Missing required env: EMAIL_FROM");

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: [
        "@/views/LessonBoardNavLink#default",
        "@/views/CustomerLookupNavLink#default",
      ],
      logout: {
        Button: "@/views/AdminLogoutButton#default",
      },
      views: {
        lessonBoard: {
          Component: "@/views/LessonBoard#default",
          path: "/lesson-board",
        },
        customerLookup: {
          Component: "@/views/CustomerLookup#default",
          path: "/customer-lookup",
        },
      },
    },
  },
  collections: [Admins, Media, Lessons, TagGroups, AudioFiles],
  editor: lexicalEditor(),
  email: resendAdapter({
    defaultFromAddress: EMAIL_FROM,
    defaultFromName: "Language Licks",
    apiKey: RESEND_API_KEY,
  }),
  secret: PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
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
  plugins: [
    gcsStorage({
      enabled: Boolean(process.env.GCS_BUCKET),
      collections: {
        "audio-files": {
          generateFileURL: ({
            filename,
            prefix,
          }: {
            filename: string;
            prefix?: string;
          }) => {
            const cdn = process.env.NEXT_PUBLIC_GCS_CDN_URL;
            const key = prefix ? `${prefix}/${filename}` : filename;
            if (cdn) return `${cdn.replace(/\/$/, "")}/${key}`;
            return `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${key}`;
          },
        },
      },
      bucket: process.env.GCS_BUCKET || "",
      options: {
        projectId: process.env.GCS_PROJECT_ID,
        credentials: process.env.GCS_CREDENTIALS
          ? JSON.parse(process.env.GCS_CREDENTIALS)
          : undefined,
      },
      acl: "Public",
    }),
  ],
});
